<script lang="ts">
  import { Tween } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { createPinchTracker } from '../../core/pinchGesture';

  interface Props {
    source: Uint32Array | null;
    working: Uint32Array | null;
    threshold: number;
    viewLo: number;
    viewHi: number;
    onZoom: (factor: number, anchorLevel: number) => void;
    onPan: (levels: number) => void;
    onWindow: (lo: number, hi: number) => void;
    onReset: () => void;
    onThreshold: (level: number) => void;
    disabled?: boolean;
    labels: {
      photo: string; adjusted: string;
      hint: string; range: string;
    };
  }

  let {
    source,
    working,
    threshold,
    viewLo,
    viewHi,
    onZoom,
    onPan,
    onReset,
    onWindow,
    onThreshold,
    disabled = false,
    labels
  }: Props = $props();

  const H = 40;

  let span = $derived(Math.max(1, viewHi - viewLo));
  let zoomed = $derived(viewLo > 0 || viewHi < 255);

  let chartEl = $state<HTMLDivElement | null>(null);
  let dragging = $state<'cut' | 'pan' | null>(null);
  let panFrom = 0;

  const pinch = createPinchTracker();
  let figureEl = $state<HTMLElement | null>(null);

  let gestureScale = 1;

  $effect(() => {
    const el = figureEl;
    if (!el) return;

    const onGesture = (ev: Event) => {
      ev.preventDefault();
      const e = ev as Event & { scale?: number; clientX?: number };

      if (ev.type === 'gesturestart') {
        gestureScale = e.scale ?? 1;
        return;
      }
      if (ev.type === 'gestureend') return;
      if (pinch.count >= 2 || disabled) return;

      const scale = e.scale ?? 1;
      if (!gestureScale || !scale) return;
      const ratio = scale / gestureScale;
      gestureScale = scale;
      if (ratio > 0 && ratio !== 1) onZoom(1 / ratio, levelAt(e.clientX ?? 0));
    };

    el.addEventListener('gesturestart', onGesture, { passive: false });
    el.addEventListener('gesturechange', onGesture, { passive: false });
    el.addEventListener('gestureend', onGesture, { passive: false });
    return () => {
      el.removeEventListener('gesturestart', onGesture);
      el.removeEventListener('gesturechange', onGesture);
      el.removeEventListener('gestureend', onGesture);
    };
  });

  function gripDistancePx(clientX: number): number {
    if (!chartEl) return Infinity;
    const box = chartEl.getBoundingClientRect();
    return Math.abs(clientX - (box.left + (cutPct / 100) * box.width));
  }

  function levelAt(clientX: number): number {
    if (!chartEl) return threshold;
    const box = chartEl.getBoundingClientRect();
    const t = (clientX - box.left) / Math.max(1, box.width);
    return viewLo + t * span;
  }

  function capture(el: Element, id: number) {
    try { el.setPointerCapture(id); } catch {  }
  }

  function onPointerDown(e: PointerEvent & { currentTarget: HTMLDivElement }) {
    if (disabled) return;

    pinch.down(e);
    if (pinch.active) {
      dragging = null;
      return;
    }

    capture(e.currentTarget, e.pointerId);

    if (e.shiftKey || e.button === 1) {
      dragging = 'pan';
      panFrom = levelAt(e.clientX);
      return;
    }

    if (e.pointerType === 'touch') {
      if (cutInView && gripDistancePx(e.clientX) <= 26) {
        dragging = 'cut';
      } else {
        dragging = 'pan';
        panFrom = levelAt(e.clientX);
      }
      return;
    }

    dragging = 'cut';
    onThreshold(levelAt(e.clientX));
  }

  function onPointerMove(e: PointerEvent) {
    const gesture = pinch.move(e);
    if (gesture) {
      if (!disabled) {
        onZoom(1 / gesture.scale, levelAt(gesture.midX));
        if (gesture.dx && chartEl) {
          const w = chartEl.getBoundingClientRect().width || 1;
          onPan((-gesture.dx / w) * span);
        }
      }
      return;
    }
    if (pinch.active) return;
    if (!dragging || disabled) return;
    if (dragging === 'cut') {
      onThreshold(levelAt(e.clientX));
    } else {
      const now = levelAt(e.clientX);
      const delta = panFrom - now;
      if (Math.abs(delta) >= 0.5) onPan(delta);
    }
  }

  function onPointerUp(e: PointerEvent & { currentTarget: HTMLDivElement }) {
    pinch.up(e);
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {  }
    if (pinch.count > 0) return;
    dragging = null;
  }

  let barEl = $state<HTMLDivElement | null>(null);
  let barDrag = $state<'lo' | 'hi' | 'window' | 'cut' | null>(null);
  let barGrabOffset = 0;

  let cutHot = $state(false);
  let cutGrabOffset = 0;
  let cutMoved = false;

  function cutRadius(): number {
    const w = barEl?.getBoundingClientRect().width || 1;
    return (7 / w) * 255;
  }

  function pickTarget(at: number): 'lo' | 'hi' | 'cut' | 'window' {
    const edge = Math.max(6, 255 * 0.04);
    const scored: Array<['lo' | 'hi' | 'cut', number]> = [
      ['lo', Math.abs(at - viewLo) / edge],
      ['hi', Math.abs(at - viewHi) / edge],
      ['cut', Math.abs(at - threshold) / cutRadius()]
    ];
    scored.sort((a, b) => a[1] - b[1]);
    return scored[0][1] < 1 ? scored[0][0] : 'window';
  }

  function barLevelAt(clientX: number): number {
    if (!barEl) return 0;
    const box = barEl.getBoundingClientRect();
    return Math.max(0, Math.min(255, ((clientX - box.left) / Math.max(1, box.width)) * 255));
  }

  function onBarDown(e: PointerEvent & { currentTarget: HTMLDivElement }) {
    if (disabled) return;
    capture(e.currentTarget, e.pointerId);
    const at = barLevelAt(e.clientX);
    const target = pickTarget(at);

    if (target === 'cut') {
      barDrag = 'cut';
      cutGrabOffset = at - threshold;
      cutMoved = false;
      return;
    }

    barDrag = target;
    if (target === 'window') barGrabOffset = at - (viewLo + viewHi) / 2;
    onBarMove(e);
  }

  function onBarMove(e: PointerEvent) {
    const at = barLevelAt(e.clientX);

    if (!barDrag) {
      const hot = !disabled && pickTarget(at) === 'cut';
      if (hot !== cutHot) cutHot = hot;
      return;
    }
    if (disabled) return;

    if (barDrag === 'cut') {
      const next = at - cutGrabOffset;
      if (Math.abs(next - threshold) >= 0.5) cutMoved = true;
      onThreshold(next);
      return;
    }

    if (barDrag === 'lo') onWindow(at, viewHi);
    else if (barDrag === 'hi') onWindow(viewLo, at);
    else {
      const half = (viewHi - viewLo) / 2;
      const mid = at - barGrabOffset;
      onWindow(mid - half, mid + half);
    }
  }

  function onBarUp(e: PointerEvent & { currentTarget: HTMLDivElement }) {
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {  }
    if (barDrag === 'cut' && !cutMoved && !disabled) {
      let lo = threshold - span / 2;
      let hi = threshold + span / 2;
      if (lo < 0) { hi -= lo; lo = 0; }
      if (hi > 255) { lo -= hi - 255; hi = 255; }
      onWindow(Math.max(0, lo), hi);
    }
    barDrag = null;
  }

  function density(counts: Uint32Array | null): Float64Array | null {
    if (!counts) return null;
    let total = 0;
    for (let i = 0; i < 256; i++) total += counts[i];
    if (total === 0) return null;
    const out = new Float64Array(256);
    for (let i = 0; i < 256; i++) out[i] = counts[i] / total;
    return out;
  }

  let sourceDensity = $derived(density(source));
  let workingDensity = $derived(density(working));

  let rawPeak = $derived.by(() => {
    let m = 0;
    for (const d of [sourceDensity, workingDensity]) {
      if (!d) continue;
      for (let i = viewLo; i <= viewHi; i++) if (d[i] > m) m = d[i];
    }
    return m;
  });

  const peakTween = new Tween(0, { duration: 220, easing: cubicOut });
  $effect(() => {
    peakTween.target = Math.log1p(rawPeak);
  });
  let sharedPeak = $derived(Math.expm1(peakTween.current));

  function outline(d: Float64Array | null, close: boolean): string {
    if (!d || sharedPeak <= 0) return '';
    const floor = Math.log1p(sharedPeak * 1e-4);
    const norm = Math.log1p(sharedPeak) - floor || 1;
    const parts: string[] = [];
    for (let i = viewLo; i <= viewHi; i++) {
      const v = Math.max(0, Math.min(1, (Math.log1p(d[i]) - floor) / norm));
      parts.push(`${i === viewLo ? 'M' : 'L'} ${i - viewLo} ${(H - v * H).toFixed(2)}`);
    }
    if (close) return `M 0 ${H} ` + parts.join(' ').slice(1) + ` L ${span} ${H} Z`;
    return parts.join(' ');
  }

  let sourcePath = $derived(outline(sourceDensity, false));
  let workingPath = $derived(outline(workingDensity, true));
  let cut = $derived(threshold - viewLo);
  let cutInView = $derived(threshold >= viewLo && threshold <= viewHi);
  let inkWidth = $derived(Math.max(0, Math.min(span, cut + 1)));

  let cutPct = $derived(Math.max(0, Math.min(100, (cut / span) * 100)));
  let badgeSide = $derived(cutPct < 18 ? 'start' : cutPct > 82 ? 'end' : 'mid');

  const uid = $props.id();
  const clipId = `hist-ink-${uid}`;

  function onWheel(e: WheelEvent) {
    if (disabled) return;
    const target = e.target as Element | null;
    if (target?.closest?.('.legend')) return;
    e.preventDefault();

    const overBar = !!target?.closest?.('.range-bar');
    const el = overBar ? barEl : chartEl;
    if (!el) return;

    const width = el.getBoundingClientRect().width || 1;
    const levels = overBar ? 255 : span;
    const anchor = overBar
      ? Math.max(viewLo, Math.min(viewHi, barLevelAt(e.clientX)))
      : levelAt(e.clientX);

    if (e.deltaX !== 0) onPan((e.deltaX / width) * levels);

    if (e.deltaY !== 0) {
      const rate = e.ctrlKey ? 0.02 : 0.002;
      onZoom(Math.exp(e.deltaY * rate), anchor);
    }
  }
</script>

<figure class="histogram" bind:this={figureEl} onwheel={onWheel}>
  <figcaption class="legend">
    <span class="key photo">{labels.photo}</span>
    <span class="key adjusted">{labels.adjusted}</span>
  </figcaption>

  <div
    class="chart"
    class:is-dragging={dragging !== null}
    class:is-disabled={disabled}
    bind:this={chartEl}
    role="slider"
    tabindex={disabled ? -1 : 0}
    aria-label={labels.hint}
    aria-valuemin={viewLo}
    aria-valuemax={viewHi}
    aria-valuenow={threshold}
    onpointerdown={onPointerDown}
    onpointermove={onPointerMove}
    onpointerup={onPointerUp}
    onpointercancel={onPointerUp}
    ondblclick={() => !disabled && onReset()}
    onkeydown={(e) => {
      if (disabled) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); onThreshold(threshold - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); onThreshold(threshold + 1); }
      else if (e.key === 'Escape') { e.preventDefault(); onReset(); }
    }}
  >
    <svg viewBox="0 0 {span} {H}" preserveAspectRatio="none" role="presentation">
      <clipPath id={clipId}>
        <rect x="0" y="0" width={inkWidth} height={H} />
      </clipPath>
      <path class="working" d={workingPath} />
      <path class="inked" d={workingPath} clip-path="url(#{clipId})" />
      <path class="photo-line" d={sourcePath} />
      {#if cutInView}
        <line class="cut" x1={cut + 0.5} y1="0" x2={cut + 0.5} y2={H} />
      {/if}
    </svg>
    {#if cutInView}
      <span class="grip" style:left="{cutPct}%"></span>
    {/if}
    <span class="range" class:at-start={badgeSide === 'start'} class:at-end={badgeSide === 'end'}
          class:off-frame={!cutInView} style:left="{cutPct}%">
      {#if !cutInView && threshold < viewLo}‹{/if}<b>{threshold}</b>{#if !cutInView && threshold > viewHi}›{/if}
    </span>
  </div>

  <div
    class="range-bar"
    class:is-dragging={barDrag !== null}
    class:cut-hot={cutHot}
    bind:this={barEl}
    role="group"
    aria-label={labels.range}
    onpointerdown={onBarDown}
    onpointermove={onBarMove}
    onpointerup={onBarUp}
    onpointercancel={onBarUp}
    onpointerleave={() => (cutHot = false)}
    ondblclick={() => !disabled && onReset()}
  >
    <span
      class="range-window"
      style:left="{(viewLo / 255) * 100}%"
      style:width="{((viewHi - viewLo) / 255) * 100}%"
    >
      <span class="range-handle lo"></span>
      <span class="range-handle hi"></span>
    </span>
    <span class="range-cut" style:left="{(threshold / 255) * 100}%"></span>
  </div>

</figure>

<style>
  .histogram {
    margin: 0;
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 4px;
  }

  .legend {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    font-size: 9px;
    line-height: 1;
    color: #64748b;
  }

  .key::before {
    content: '';
    display: inline-block;
    width: 8px;
    height: 0;
    margin-right: 4px;
    vertical-align: middle;
  }

  .key.photo { color: #64748b; }
  .key.photo::before { border-top: 1px solid rgba(124, 138, 163, 0.55); }
  .key.adjusted { color: #7f9bc4; }
  .key.adjusted::before { border-top: 4px solid #3b5580; }

  .chart {
    position: relative;
    display: block;
    width: 100%;
    border: 1px solid #1e2232;
    border-radius: 6px;
    background: #11131c;
    overflow: hidden;
    cursor: ew-resize;
    touch-action: none;
    transition: border-color 0.15s ease;
  }

  .chart:hover,
  .chart:focus-visible {
    border-color: #2b3044;
    outline: none;
  }

  .chart:focus-visible { border-color: #3b82f6; }
  .chart.is-dragging { cursor: grabbing; }
  .chart.is-disabled { cursor: not-allowed; opacity: 0.55; }

  .grip {
    position: absolute;
    top: 0;
    width: 9px;
    height: 7px;
    margin-left: -4.5px;
    border-radius: 0 0 3px 3px;
    background: #dbeafe;
    pointer-events: none;
  }

  svg {
    display: block;
    width: 100%;
    height: 40px;
  }

  .range {
    position: absolute;
    top: 3px;
    transform: translateX(-50%);
    display: inline-flex;
    align-items: baseline;
    gap: 4px;
    font-family: var(--font-mono);
    font-size: 9px;
    color: #93a4bd;
    background: rgba(17, 19, 28, 0.78);
    padding: 0 4px;
    border-radius: 3px;
    pointer-events: none;
  }

  .range b {
    color: #dbeafe;
    font-weight: 700;
  }

  .range.at-start { transform: translateX(0); }
  .range.at-end { transform: translateX(-100%); }

  .range.off-frame {
    color: #f0abfc;
    background: rgba(17, 19, 28, 0.9);
  }

  .range.off-frame b { color: #f0abfc; }

  .working { fill: #2b3a55; }
  .inked { fill: #60a5fa; }

  .photo-line {
    fill: none;
    stroke: #7c8aa3;
    stroke-width: 1;
    stroke-linejoin: round;
    opacity: 0.4;
    vector-effect: non-scaling-stroke;
  }

  .cut {
    stroke: #dbeafe;
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }

  .range-bar {
    position: relative;
    height: 10px;
    border-radius: 3px;
    background: #11131c;
    border: 1px solid #1a1d2c;
    cursor: ew-resize;
    touch-action: none;
    overflow: hidden;
  }

  .range-bar.is-dragging { cursor: grabbing; }

  .range-window {
    position: absolute;
    top: 0;
    bottom: 0;
    background: rgba(59, 130, 246, 0.16);
    border-left: 1px solid #3b82f6;
    border-right: 1px solid #3b82f6;
    min-width: 4px;
    pointer-events: none;
  }

  .range-handle {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 3px;
  }

  .range-handle.lo { left: 0; background: #60a5fa; }
  .range-handle.hi { right: 0; background: #60a5fa; }

  .range-cut {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    margin-left: -1px;
    background: #dbeafe;
    pointer-events: none;
    transition: width 0.12s ease, margin-left 0.12s ease, background 0.12s ease;
  }

  .range-bar.cut-hot {
    cursor: grab;
  }

  .range-bar.cut-hot.is-dragging {
    cursor: grabbing;
  }

  .range-bar.cut-hot .range-cut {
    width: 4px;
    margin-left: -2px;
    background: #ffffff;
  }
</style>
