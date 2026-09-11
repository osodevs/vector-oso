<script lang="ts">
  import type { PreprocessOptions, TraceOptions } from '../core/types';
  import type { Translations } from '../i18n';
  import PresetSelector from './inspector/PresetSelector.svelte';
  import InspectorSlider from './inspector/InspectorSlider.svelte';
  import SourceReadout from './inspector/SourceReadout.svelte';
  import type { Resample } from '../core/sourceBudget';
  import Histogram from './inspector/Histogram.svelte';
  import type { SourceProfile } from '../core/imageAnalysis';
  import { SHAPE_KEYS, type Proposal, type SettingKey } from '../core/settings';

  interface Props {
    t: Translations['inspector'];
    preprocess: PreprocessOptions;
    trace: TraceOptions;
    histogram?: Uint32Array | null;
    sourceProfile?: SourceProfile | null;
    resample?: Resample | null;
    strokeWidthPx?: number;
    channelAvailable?: boolean;
    lightingAvailable?: boolean;
    useAutoChannel?: boolean;
    useFlattenLighting?: boolean;
    proposal: Proposal;
    anyEdited: boolean;
    onEdited: (key: SettingKey) => void;
    onRevert: (key: SettingKey) => void;
    onRevertAll: () => void;
    disabled: boolean;
    viewMode?: 'original' | 'mask' | 'overlay' | 'vector';
  }

  let {
    t,
    preprocess = $bindable(),
    trace = $bindable(),
    histogram = null,
    sourceProfile = null,
    resample = null,
    strokeWidthPx = 1,
    channelAvailable = false,
    lightingAvailable = false,
    useAutoChannel = $bindable(true),
    useFlattenLighting = $bindable(true),
    proposal,
    anyEdited,
    onEdited,
    onRevert,
    onRevertAll,
    disabled,
    viewMode = 'vector'
  }: Props = $props();

  let isVectorPhase = $derived(viewMode === 'vector' || viewMode === 'overlay');
  let isImagePhase = $derived(viewMode === 'original' || viewMode === 'mask');

  const MIN_WINDOW = 8;

  let viewLo = $state(0);
  let viewHi = $state(255);

  function setView(lo: number, hi: number) {
    let a = Math.max(0, Math.min(255 - MIN_WINDOW, Math.round(lo)));
    let b = Math.min(255, Math.max(a + MIN_WINDOW, Math.round(hi)));
    if (b - a < MIN_WINDOW) a = Math.max(0, b - MIN_WINDOW);
    viewLo = a;
    viewHi = b;
  }

  function zoomView(factor: number, anchor: number) {
    const span = viewHi - viewLo;
    const next = Math.max(MIN_WINDOW, Math.min(255, span * factor));
    const t = span > 0 ? (anchor - viewLo) / span : 0.5;
    setView(anchor - t * next, anchor + (1 - t) * next);
  }

  function panView(levels: number) {
    const span = viewHi - viewLo;
    let lo = viewLo + levels;
    if (lo < 0) lo = 0;
    if (lo + span > 255) lo = 255 - span;
    setView(lo, lo + span);
  }

  function resetView() {
    viewLo = 0;
    viewHi = 255;
  }

  function setThreshold(level: number) {
    const v = Math.max(0, Math.min(255, Math.round(level)));
    if (v === preprocess.threshold) return;
    preprocess.threshold = v;
    onEdited('threshold');
  }

  type TargetPatch = Partial<Pick<TraceOptions, (typeof SHAPE_KEYS)[number]>>;

  const TARGETS: Record<string, TargetPatch> = {
    default: { mode: 'subpixel', edgeSmooth: 2, simplifyTolerance: 0.2 },
    plotter: { mode: 'subpixel', edgeSmooth: 3, simplifyTolerance: 0.3 },
    cutter: { mode: 'subpixel', edgeSmooth: 2, simplifyTolerance: 0.15 },
    laser: { mode: 'subpixel', edgeSmooth: 3, simplifyTolerance: 0.1 },
    stencil: { mode: 'subpixel', edgeSmooth: 1, simplifyTolerance: 0.1 }
  };

  let activeTarget = $state<string>('default');

  function handleTargetChange(name: string) {
    const patch = TARGETS[name] ?? TARGETS.default;
    trace = { ...trace, ...patch };
    activeTarget = name;
    for (const k of SHAPE_KEYS) onEdited(k);
  }

</script>

{#snippet sectionSettings()}
  <div id="section-mask" class="section-block" class:active-focus={isImagePhase}>
    <div class="section-kicker-row">
      <span class="section-kicker">01 · {t.settingsHeader}</span>
      {#if isImagePhase}
        <span class="active-context-badge">
          <span class="pulse-dot">●</span>
          <span>{viewMode === 'mask' ? 'Maske' : 'Original'}</span>
        </span>
      {/if}
    </div>

    <div class="cut-panel">
      <Histogram
        source={sourceProfile?.sourceHistogram ?? null}
        working={histogram}
        threshold={preprocess.threshold}
        {viewLo}
        {viewHi}
        onZoom={zoomView}
        onPan={panView}
        onReset={resetView}
        onThreshold={setThreshold}
        onWindow={setView}
        {disabled}
        labels={t.histogram}
      />

      <InspectorSlider
        id="threshold-range"
        label={t.thresholdLabel}
        tooltip={t.thresholdTooltip}
        min={0}
        max={255}
        step={1}
        bind:value={preprocess.threshold}
        autoValue={proposal.pre.threshold}
        autoHint={t.autoHintThreshold}
        onEdited={() => onEdited('threshold')}
        onRevert={() => onRevert('threshold')}
        showTrack={false}
        bare
        {disabled}
      />
    </div>

    <InspectorSlider
      id="soften-range"
      label={t.softenLabel}
      tooltip={t.softenTooltip}
      min={0}
      max={4}
      step={1}
      unit=" px"
      formatValue={(v) => (v === 0 ? t.softenOff : t.softenValue(v))}
      bind:value={preprocess.blur}
      autoValue={proposal.pre.blur}
      autoHint={t.autoHintSoften}
      onEdited={() => onEdited('blur')}
      onRevert={() => onRevert('blur')}
      {disabled}
    />

    <InspectorSlider
      id="detail-range"
      label={t.minDetailLabel}
      tooltip={t.minDetailTooltip}
      min={0}
      max={48}
      step={1}
      unit=" px"
      formatValue={(v) => (v === 0 ? t.minDetailOff : t.minDetailValue(v))}
      bind:value={preprocess.minDetail}
      autoValue={proposal.pre.minDetail}
      autoHint={t.autoHintDetail}
      onEdited={() => onEdited('minDetail')}
      onRevert={() => onRevert('minDetail')}
      {disabled}
    />
  </div>
{/snippet}

{#snippet sectionVectorShape()}
  <div id="section-vector" class="section-block" class:active-focus={isVectorPhase}>
    <div class="section-kicker-row">
      <span class="section-kicker">02 · {t.vectorShapeHeader}</span>
      {#if isVectorPhase}
        <span class="active-context-badge">
          <span class="pulse-dot">●</span>
          <span>{viewMode === 'vector' ? 'SVG Vektor' : 'Overlay'}</span>
        </span>
      {/if}
    </div>

    <div class="mode-card">
      <div class="field-header" style="margin-bottom: 8px;">
        <span class="field-label">
          <span>{t.modeLabel}</span>
          <span class="field-info" title={t.modeTooltip}>ⓘ</span>
        </span>
      </div>
      <div class="mode-segmented">
        <button
          type="button"
          class:active={trace.mode === 'pixel'}
          onclick={() => { trace.mode = 'pixel'; onEdited('mode'); }}
          {disabled}
        >
          <span class="dot">●</span>
          <span>{t.modePixel}</span>
        </button>
        <button
          type="button"
          class:active={trace.mode === 'subpixel'}
          onclick={() => { trace.mode = 'subpixel'; onEdited('mode'); }}
          {disabled}
        >
          <span class="dot">●</span>
          <span>{t.modeSubpixel}</span>
        </button>
      </div>
      <p class="mode-caption">
        {trace.mode === 'pixel' ? t.modePixelHint : t.modeSubpixelHint}
      </p>
    </div>

    <InspectorSlider
      id="smooth-range"
      label={t.edgeSmoothLabel}
      tooltip={t.edgeSmoothTooltip}
      min={0}
      max={30}
      step={0.5}
      bind:value={trace.edgeSmooth}
      autoValue={proposal.trace.edgeSmooth}
      autoHint={t.autoHintShape}
      onEdited={() => onEdited('edgeSmooth')}
      onRevert={() => onRevert('edgeSmooth')}
      {disabled}
    />

    <InspectorSlider
      id="simplify-range"
      label={t.simplifyLabel}
      tooltip={t.simplifyHint}
      min={0}
      max={1}
      step={0.05}
      unit=" mm"
      bind:value={trace.simplifyTolerance}
      autoValue={proposal.trace.simplifyTolerance}
      autoHint={t.autoHintShape}
      onEdited={() => onEdited('simplifyTolerance')}
      onRevert={() => onRevert('simplifyTolerance')}
      {disabled}
    />
  </div>
{/snippet}

<aside class="inspector">
  <PresetSelector
    {t}
    activePreset={activeTarget}
    presetDirty={anyEdited}
    {disabled}
    onSelectPreset={handleTargetChange}
    onReset={onRevertAll}
  />

  <SourceReadout
    t={t.source}
    profile={sourceProfile}
    {resample}
    {strokeWidthPx}
    {channelAvailable}
    {lightingAvailable}
    bind:useAutoChannel
    bind:useFlattenLighting
    {disabled}
  />

  <div class="inspector-body">
    {@render sectionSettings()}
    {@render sectionVectorShape()}
  </div>
</aside>

<style>
  .inspector {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #0f1118;
    user-select: none;
    overflow-x: hidden;
    width: 100%;
  }

  .inspector-body {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    box-shadow: inset 0 8px 12px -8px rgba(0, 0, 0, 0.6),
      inset 0 -8px 12px -8px rgba(0, 0, 0, 0.6);
  }

  .section-block {
    display: flex;
    flex-direction: column;
    gap: 8px;
    border-radius: 10px;
    transition: all 0.2s ease;
  }

  .section-block.active-focus {
    background: rgba(37, 99, 235, 0.04);
    padding: 6px 6px 10px;
    border: 1px solid rgba(59, 130, 246, 0.18);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  }

  .active-context-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 9px;
    font-weight: 800;
    color: #60a5fa;
    background: rgba(37, 99, 235, 0.15);
    padding: 2px 6px;
    border-radius: 10px;
    border: 1px solid rgba(59, 130, 246, 0.3);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .pulse-dot {
    font-size: 7px;
    color: #3b82f6;
  }

  .section-kicker-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 2px 4px;
  }

  .section-kicker {
    font-size: 9.5px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #64748b;
  }

  .field-info {
    font-size: 10px;
    color: #64748b;
    cursor: help;
  }

  .cut-panel {
    display: flex;
    flex-direction: column;
    width: 100%;
    box-sizing: border-box;
    gap: 8px;
    padding: 10px 12px;
    border: 1px solid #1e2232;
    border-radius: 8px;
    background: #11131c;
    transition: border-color 0.15s ease;
  }

  .cut-panel:hover {
    border-color: #2b3044;
  }

  .mode-card {
    background: #11131c;
    border: 1px solid #1e2232;
    padding: 10px 12px;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .field-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .field-label {
    font-size: 11px;
    font-weight: 700;
    color: #cbd5e1;
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .mode-segmented {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
    background: #0b0c11;
    padding: 3px;
    border-radius: 6px;
    border: 1px solid #1a1d2c;
  }

  .mode-segmented button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 6px;
    border-radius: 4px;
    background: transparent;
    border: none;
    color: #94a3b8;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .mode-segmented button:hover:not(:disabled) {
    color: #f1f5f9;
  }

  .mode-segmented button.active {
    background: #1e2438;
    color: #60a5fa;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
  }

  .mode-segmented button .dot {
    font-size: 8px;
    opacity: 0.4;
  }

  .mode-segmented button.active .dot {
    opacity: 1;
    color: #3b82f6;
  }

  .mode-caption {
    font-size: 10.5px;
    color: #64748b;
    line-height: 1.4;
    margin-top: 2px;
  }

  @media (max-width: 900px) {
    .inspector {
      height: auto;
    }

    .inspector-body {
      padding: 8px;
      gap: 10px;
      overflow: visible;
      box-shadow: none;
    }

    .section-block {
      gap: 6px;
    }

    .section-block.active-focus {
      padding: 4px 5px 7px;
    }

    .section-kicker-row {
      padding: 0 2px;
    }

    .mode-card {
      padding: 8px 10px;
      gap: 4px;
    }

    .mode-card .field-header {
      margin-bottom: 5px !important;
    }

    .mode-segmented button {
      padding: 5px;
    }

    .mode-caption {
      display: none;
    }
  }
</style>
