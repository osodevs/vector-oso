<script lang="ts">
  import type { SourceProfile } from '../../core/imageAnalysis';
  import type { Resample } from '../../core/sourceBudget';
  import { tracePreference, setTraceDetail, type TraceDetail } from '../../core/tracePreference.svelte';
  import type { Translations } from '../../i18n';

  interface Props {
    t: Translations['inspector']['source'];
    profile: SourceProfile | null;
    resample?: Resample | null;
    strokeWidthPx: number;
    channelAvailable: boolean;
    lightingAvailable: boolean;
    useAutoChannel: boolean;
    useFlattenLighting: boolean;
    disabled: boolean;
  }

  let {
    t,
    profile,
    resample = null,
    strokeWidthPx,
    channelAvailable,
    lightingAvailable,
    useAutoChannel = $bindable(),
    useFlattenLighting = $bindable(),
    disabled
  }: Props = $props();

  let kind = $derived.by<'line' | 'solid' | 'photo' | 'drawing'>(() => {
    if (!profile) return 'drawing';
    if (profile.bimodality > 0.8 && profile.inkFraction < 0.25) return 'line';
    if (profile.inkFraction > 0.45) return 'solid';
    if (profile.bimodality < 0.68) return 'photo';
    return 'drawing';
  });

  let levelsMeaningful = $derived(!!profile && !profile.usesChannelMix && profile.levelStretch < 4);
  let stretched = $derived(levelsMeaningful && (profile?.levelStretch ?? 1) > 1.02);
  let stretchText = $derived((profile?.levelStretch ?? 1).toFixed(2).replace(/\.?0+$/, ''));

  let channel = $derived.by<'red' | 'green' | 'blue'>(() => {
    if (!profile) return 'green';
    const [r, g, b] = profile.projection;
    const max = Math.max(r, g, b);
    if (max === r) return 'red';
    if (max === b) return 'blue';
    return 'green';
  });
</script>

{#if profile}
  <div class="source-readout" class:is-disabled={disabled}>
    <div class="readout-kicker">{t.sectionLabel}</div>
    <div class="readout-line">
      <span class="readout-kind">{t.kind(kind)}</span>
      <span class="readout-meta">{t.strokeMeta(Math.round(strokeWidthPx))}</span>
    </div>

    <div class="verdict detail-verdict" class:acted={tracePreference.detail !== 'auto'}>
      <span class="verdict-label">{t.detailLabel}</span>
      <div class="detail-choices" role="group" aria-label={t.detailLabel}>
        {#each ['auto', 'full', 'compact'] as const as choice}
          <button
            type="button"
            class="verdict-chip detail-chip"
            class:on={tracePreference.detail === choice}
            {disabled}
            aria-pressed={tracePreference.detail === choice}
            onclick={() => setTraceDetail(choice as TraceDetail)}
            title={t.detailTitle(choice)}
          >
            {t.detailOption(choice)}
          </button>
        {/each}
      </div>
    </div>

    {#if resample}
      <div class="readout-resample" title={t.resampleTitle}>
        {t.resample(
          `${resample.from.width}×${resample.from.height}`,
          `${resample.to.width}×${resample.to.height}`
        )}
      </div>
    {/if}

    {#if tracePreference.demoted && tracePreference.detail === 'auto'}
      <div class="readout-resample demoted" title={t.detailDemotedTitle}>{t.detailDemoted}</div>
    {/if}

    <div class="verdicts">
      <div class="verdict" class:acted={channelAvailable && useAutoChannel}>
        <span class="verdict-label">{t.colourLabel}</span>
        {#if channelAvailable}
          <button
            type="button"
            class="verdict-chip"
            class:on={useAutoChannel}
            {disabled}
            aria-pressed={useAutoChannel}
            onclick={() => (useAutoChannel = !useAutoChannel)}
            title={t.colourTitle(channel, profile.separationGain.toFixed(1))}
          >
            <span class="verdict-dot"></span>
            <span class="verdict-text">
              {useAutoChannel ? t.colourFixed(channel) : `${t.colourFixed(channel)} — ${t.offSuffix}`}
            </span>
            <span class="verdict-num">{profile.separationGain.toFixed(1)}×</span>
          </button>
        {:else}
          <span class="verdict-noop">{t.colourNoop}</span>
        {/if}
      </div>

      <div class="verdict" class:acted={lightingAvailable && useFlattenLighting}>
        <span class="verdict-label">{t.lightingLabel}</span>
        {#if lightingAvailable}
          <button
            type="button"
            class="verdict-chip"
            class:on={useFlattenLighting}
            {disabled}
            aria-pressed={useFlattenLighting}
            onclick={() => (useFlattenLighting = !useFlattenLighting)}
            title={t.lightingTitle(Math.round(profile.illuminationRange))}
          >
            <span class="verdict-dot"></span>
            <span class="verdict-text">
              {useFlattenLighting ? t.lightingFixed : `${t.lightingFixed} — ${t.offSuffix}`}
            </span>
            <span class="verdict-num">{Math.round(profile.illuminationRange)}</span>
          </button>
        {:else}
          <span class="verdict-noop">{t.lightingNoop}</span>
        {/if}
      </div>

      {#if levelsMeaningful}
        <div class="verdict" class:acted={stretched}>
          <span class="verdict-label">{t.levelsLabel}</span>
          {#if stretched}
            <span class="verdict-noop is-acted" title={t.levelsTitle(stretchText)}>
              <span class="verdict-dot"></span>
              {t.levelsFixed(stretchText)}
            </span>
          {:else}
            <span class="verdict-noop">{t.levelsNoop}</span>
          {/if}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .readout-kicker {
    font-size: 9px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #475569;
  }

  .source-readout {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px 12px;
    border-bottom: 1px solid #1a1d2c;
    background: #0d0f16;
  }

  .source-readout.is-disabled {
    opacity: 0.5;
  }

  .readout-line {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    min-width: 0;
  }

  .readout-kind {
    font-size: 11px;
    font-weight: 750;
    color: #cbd5e1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .readout-meta {
    font-family: var(--font-mono);
    font-size: 9.5px;
    color: #64748b;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .detail-verdict {
    margin-top: 2px;
  }

  .detail-choices {
    display: flex;
    gap: 3px;
  }

  .detail-chip {
    padding: 2px 7px;
    justify-content: center;
  }

  .demoted {
    color: #d97706;
  }

  .readout-resample {
    font-family: var(--font-mono);
    font-size: 9.5px;
    line-height: 1.35;
    color: #64748b;
    cursor: help;
  }

  .verdicts {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .verdict {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }

  .verdict-label {
    flex: 0 0 46px;
    font-size: 9.5px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #475569;
  }

  .verdict-noop {
    font-size: 10px;
    color: #566274;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .verdict-noop.is-acted {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #93a4bd;
    cursor: help;
  }

  .verdict-noop.is-acted .verdict-dot {
    background: #60a5fa;
    box-shadow: 0 0 6px rgba(96, 165, 250, 0.8);
  }

  .verdict-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 2px 8px;
    border-radius: 999px;
    background: #12141d;
    border: 1px solid #232738;
    color: #64748b;
    font-size: 10px;
    font-weight: 700;
    cursor: pointer;
    min-width: 0;
    transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  }

  .verdict-chip:hover:not(:disabled) {
    border-color: #3b4a68;
    color: #cbd5e1;
  }

  .verdict-chip.on {
    background: rgba(37, 99, 235, 0.14);
    border-color: rgba(59, 130, 246, 0.5);
    color: #93c5fd;
  }

  .verdict-chip:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .verdict-text {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .verdict-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #3b4a68;
    flex-shrink: 0;
    transition: background 0.15s ease;
  }

  .verdict-chip.on .verdict-dot {
    background: #60a5fa;
    box-shadow: 0 0 6px rgba(96, 165, 250, 0.8);
  }

  .verdict-num {
    font-family: var(--font-mono);
    font-size: 9px;
    opacity: 0.75;
    flex-shrink: 0;
  }
</style>
