<script lang="ts">
  import type { Point, BezierContour } from '../../core/types';
  import CanvasRevealOverlay from './CanvasRevealOverlay.svelte';
  import { REVEAL_SECONDS, REVEAL_STYLE_DEFS } from '../../core/revealChoreography';
  import type { RevealTiming, RevealStyle } from '../../core/revealChoreography';
  import type { ViewWindow } from '../../canvas/viewWindow';

  interface Props {
    width: number;
    height: number;
    viewMode: 'original' | 'mask' | 'overlay' | 'vector';
    maskDisplayMode: 'bright' | 'dark' | 'overlay' | 'overlay-pink' | 'overlay-amber' | 'overlay-red';
    canvasBg: 'grid' | 'white' | 'dark';
    overlayColorMode: 'blue' | 'amber' | 'pink' | 'black';
    overlayBase: 'original' | 'mask-bright' | 'mask-dark';
    panX: number;
    panY: number;
    zoomLevel: number;

    viewWindow: ViewWindow | null;
    viewportBusy?: boolean;
    invScale: number;
    vectorFillColor: string;
    combinedSvgPath: string;
    individualPathStrings: string[];
    selectedContoursCombinedPath: string;
    selectedOutlinePath: string;
    hoveredContourPath: string;
    hoveredOutlinePath: string;
    activeStrokePoints: Point[];
    maskTool: 'move' | 'brush' | 'lasso';
    maskAction: 'remove' | 'add' | 'auto';
    lassoRegion: 'inside' | 'outside';
    brushRadius: number;
    liveBrushPath: string;
    revealKey: number;
    revealTimings: RevealTiming[];
    carveMassPath: string;
    fullAreaPath: string;
    revealStyle: RevealStyle;
    revealPending: boolean;
    baseCanvasEl?: HTMLCanvasElement;
    maskCanvasEl?: HTMLCanvasElement;
    onRevealDone: () => void;
  }

  let {
    width,
    height,
    viewMode,
    maskDisplayMode,
    canvasBg,
    overlayColorMode,
    overlayBase,
    panX,
    panY,
    zoomLevel,
    viewWindow,
    viewportBusy = false,
    invScale,
    vectorFillColor,
    combinedSvgPath,
    individualPathStrings,
    selectedContoursCombinedPath,
    selectedOutlinePath,
    hoveredContourPath,
    hoveredOutlinePath,
    activeStrokePoints,
    maskTool,
    maskAction,
    lassoRegion,
    brushRadius,
    liveBrushPath,
    revealKey,
    revealTimings,
    carveMassPath,
    fullAreaPath,
    revealStyle,
    revealPending,
    baseCanvasEl = $bindable(),
    maskCanvasEl = $bindable(),
    onRevealDone
  }: Props = $props();

  let overlayOnMask = $derived(viewMode === 'overlay' && overlayBase !== 'original');

  let lassoPoints = $derived(activeStrokePoints.map((p) => `${p.x} ${p.y}`).join('L'));

  let deepZoom = $derived(Math.max(width, height) * (zoomLevel / 100) > 8192);

  let vectorBox = $derived(viewWindow ?? { x: 0, y: 0, w: width, h: height });
  let stageScale = $derived(Math.max(0.0001, zoomLevel / 100));

  let rasterInView = $derived(
    viewMode === 'original' ||
    (viewMode === 'overlay' && overlayBase === 'original') ||
    (viewMode === 'mask' && maskDisplayMode.startsWith('overlay'))
  );
  let maskInView = $derived(viewMode === 'mask' || overlayOnMask);
  let vectorInView = $derived(viewMode === 'vector' || viewMode === 'overlay');

  let accent = $derived.by(() => {
    if (viewMode === 'overlay') {
      switch (overlayColorMode) {
        case 'blue':
          return { base: '#fbbf24', bright: '#fde68a', rgb: '251, 191, 36' };
        case 'amber':
          return { base: '#22d3ee', bright: '#a5f3fc', rgb: '34, 211, 238' };
        case 'pink':
          return { base: '#34d399', bright: '#a7f3d0', rgb: '52, 211, 153' };
        default:
          return { base: '#22d3ee', bright: '#a5f3fc', rgb: '34, 211, 238' };
      }
    }
    return { base: '#22d3ee', bright: '#a5f3fc', rgb: '34, 211, 238' };
  });

  let revealRetiresRaster = $derived(!rasterInView);
  let revealTarget = $derived<'vector' | 'mask' | 'none'>(
    vectorInView ? 'vector' : maskInView ? 'mask' : 'none'
  );
</script>

<div
  class="canvas-stage bg-{canvasBg}"
  class:viewport-busy={viewportBusy}
  class:deep-zoom={deepZoom}
  class:reveal-wipe={revealKey > 0}
  class:reveal-holding={revealPending}
  data-reveal-transition={REVEAL_STYLE_DEFS[revealStyle].transition}
  data-reveal-retire={revealRetiresRaster ? 'raster' : 'none'}
  data-reveal-target={revealTarget}
  style:transform="translate({panX}px, {panY}px) scale({zoomLevel / 100})"
  style:width="{width}px"
  style:height="{height}px"
  style:--reveal-dur="{REVEAL_SECONDS}s"
  style:--zoom={zoomLevel / 100}
>

  {#if canvasBg === 'grid' && viewMode === 'vector' && !deepZoom}
    <div class="checkerboard-light"></div>
  {/if}

  <canvas
    bind:this={baseCanvasEl}
    class="raster-layer"
    class:layer-hidden={!rasterInView}
    class:windowed={!!viewWindow}
    style:left={viewWindow ? `${vectorBox.x}px` : null}
    style:top={viewWindow ? `${vectorBox.y}px` : null}
    style:width={viewWindow ? `${vectorBox.w * stageScale}px` : null}
    style:height={viewWindow ? `${vectorBox.h * stageScale}px` : null}
    style:transform={viewWindow ? `scale(${1 / stageScale})` : null}
  ></canvas>

  <canvas
    bind:this={maskCanvasEl}
    class="mask-overlay-layer"
    class:layer-hidden={!maskInView}
    class:windowed={!!viewWindow}
    style:left={viewWindow ? `${vectorBox.x}px` : null}
    style:top={viewWindow ? `${vectorBox.y}px` : null}
    style:width={viewWindow ? `${vectorBox.w * stageScale}px` : null}
    style:height={viewWindow ? `${vectorBox.h * stageScale}px` : null}
    style:transform={viewWindow ? `scale(${1 / stageScale})` : null}
  ></canvas>

  {#if viewMode === 'vector' || viewMode === 'overlay'}
    <svg
      class="vector-layer"
      class:windowed={!!viewWindow}
      viewBox="{vectorBox.x} {vectorBox.y} {vectorBox.w} {vectorBox.h}"
      style:left="{vectorBox.x}px"
      style:top="{vectorBox.y}px"
      style:width="{viewWindow ? vectorBox.w * stageScale : vectorBox.w}px"
      style:height="{viewWindow ? vectorBox.h * stageScale : vectorBox.h}px"
      style:transform={viewWindow ? `scale(${1 / stageScale})` : null}
    >
      {#if viewMode === 'vector'}
        <path d={combinedSvgPath} fill={vectorFillColor} fill-rule="nonzero" style="pointer-events: none;" />
      {:else if viewMode === 'overlay'}
        <path
          d={combinedSvgPath}
          class="vector-overlay-path"
          class:is-translucent={overlayColorMode !== 'black'}
          fill={overlayColorMode === 'pink'
            ? 'rgba(236, 72, 153, 0.45)'
            : overlayColorMode === 'amber'
              ? 'rgba(245, 158, 11, 0.38)'
              : overlayColorMode === 'black'
                ? '#000000'
                : 'rgba(37, 99, 235, 0.35)'}
          stroke={overlayColorMode === 'pink'
            ? '#ec4899'
            : overlayColorMode === 'amber'
              ? '#f59e0b'
              : overlayColorMode === 'black'
                ? '#000000'
                : '#2563eb'}
          stroke-width={(overlayColorMode === 'black' ? 0.8 : 1.8) * invScale}
          fill-rule="nonzero"
          style="pointer-events: none;"
        />
      {/if}
    </svg>

    <svg
      class="interaction-layer"
      class:windowed={!!viewWindow}
      viewBox="{vectorBox.x} {vectorBox.y} {vectorBox.w} {vectorBox.h}"
      style:left="{vectorBox.x}px"
      style:top="{vectorBox.y}px"
      style:width="{viewWindow ? vectorBox.w * stageScale : vectorBox.w}px"
      style:height="{viewWindow ? vectorBox.h * stageScale : vectorBox.h}px"
      style:transform={viewWindow ? `scale(${1 / stageScale})` : null}
      aria-hidden="true"
    >
      {#if selectedContoursCombinedPath}
        <path
          d={selectedContoursCombinedPath}
          fill="rgba({accent.rgb}, 0.26)"
          fill-rule="nonzero"
          stroke="none"
          style="pointer-events: none;"
        />
        <path
          d={selectedOutlinePath}
          fill="none"
          stroke="#04121a"
          stroke-opacity="0.55"
          stroke-width={5.6 * invScale}
          class="active-path-outline"
          style="pointer-events: none;"
        />
        <path
          d={selectedOutlinePath}
          fill="none"
          stroke={accent.bright}
          stroke-width={3 * invScale}
          class="active-path-outline selected-outline"
          style="pointer-events: none;"
        />
      {/if}

      {#if hoveredContourPath}
        <path
          d={hoveredContourPath}
          fill="rgba({accent.rgb}, 0.11)"
          fill-rule="nonzero"
          stroke="none"
          style="pointer-events: none;"
        />
        <path
          d={hoveredOutlinePath}
          fill="none"
          stroke="#04121a"
          stroke-opacity="0.4"
          stroke-width={3.6 * invScale}
          class="active-path-outline"
          style="pointer-events: none;"
        />
        <path
          d={hoveredOutlinePath}
          fill="none"
          stroke={accent.base}
          stroke-opacity="0.9"
          stroke-width={1.8 * invScale}
          class="active-path-outline hovered-outline"
          style="pointer-events: none;"
        />
      {/if}
    </svg>
  {/if}

  {#if viewMode === 'mask' && activeStrokePoints.length > 0}
    <svg class="mask-drawing-overlay" viewBox="0 0 {width} {height}">
      {#if maskTool === 'brush'}
        <path
          d={liveBrushPath}
          fill="none"
          stroke={maskAction === 'remove' ? 'rgba(239, 68, 68, 0.7)' : maskAction === 'add' ? 'rgba(37, 99, 235, 0.7)' : 'rgba(16, 185, 129, 0.75)'}
          stroke-width={brushRadius * 2}
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      {:else if maskTool === 'lasso'}

        <path
          d={lassoRegion === 'outside'
            ? `M0 0H${width}V${height}H0Z M${lassoPoints}Z`
            : `M${lassoPoints}Z`}
          fill-rule="evenodd"
          fill={maskAction === 'remove' ? 'rgba(239, 68, 68, 0.22)' : maskAction === 'add' ? 'rgba(37, 99, 235, 0.22)' : 'rgba(16, 185, 129, 0.22)'}
          stroke="none"
        />
        <polygon
          points={activeStrokePoints.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke={maskAction === 'remove' ? '#ef4444' : maskAction === 'add' ? '#3b82f6' : '#10b981'}
          stroke-width="2"
          stroke-dasharray="4 4"
        />
      {/if}
    </svg>
  {/if}

  {#key revealKey}
    {#if revealKey > 0 && individualPathStrings.length > 0}
      <CanvasRevealOverlay
        {width}
        {height}
        paths={individualPathStrings}
        timings={revealTimings}
        {carveMassPath}
        {fullAreaPath}
        style={revealStyle}
        duration={REVEAL_SECONDS}
        onDone={onRevealDone}
      />
    {/if}
  {/key}

  <div class="stage-frame-border"></div>
</div>

<style>
  .canvas-stage {
    position: relative;
    flex-shrink: 0;
    transform-origin: center center;
    border-radius: 3px;
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.18), 0 0 0 2px rgba(0, 0, 0, 0.9);
    background-color: #ffffff;
    overflow: hidden;
    transition: background-color 0.15s ease;
  }

  .stage-frame-border {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 10;
    border: calc(1.5px / var(--zoom, 1)) solid rgba(255, 255, 255, 0.35);
    box-shadow: inset 0 0 0 calc(1px / var(--zoom, 1)) rgba(0, 0, 0, 0.7);
    border-radius: calc(3px / var(--zoom, 1));
  }

  .canvas-stage.bg-grid.deep-zoom {
    background-color: #eef2f7;
  }

  .canvas-stage.bg-white {
    background-color: #ffffff !important;
  }

  .canvas-stage.bg-dark {
    background-color: #12131b !important;
  }

  .canvas-stage.bg-grid {
    background-color: #ffffff !important;
  }

  .checkerboard-light {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    background-image: linear-gradient(45deg, #e2e8f0 25%, transparent 25%),
      linear-gradient(-45deg, #e2e8f0 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #e2e8f0 75%),
      linear-gradient(-45deg, transparent 75%, #e2e8f0 75%);
    background-size: 16px 16px;
    background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
    background-color: #ffffff;
    pointer-events: none;
    z-index: 0;
  }

  .raster-layer {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    image-rendering: pixelated;
    display: block;
    z-index: 1;
  }

  .mask-overlay-layer {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    image-rendering: pixelated;
    display: block;
    z-index: 2;
    pointer-events: none;
  }

  .layer-hidden {
    opacity: 0;
    pointer-events: none;
  }

  .canvas-stage.reveal-wipe .raster-layer,
  .canvas-stage.reveal-holding .raster-layer {
    opacity: 1;
  }

  .canvas-stage.reveal-wipe[data-reveal-retire='raster'][data-reveal-transition='wipe-linear'] .raster-layer {
    -webkit-mask-image: linear-gradient(96deg, transparent 0%, transparent 45%, #000 55%, #000 100%);
    mask-image: linear-gradient(96deg, transparent 0%, transparent 45%, #000 55%, #000 100%);
    -webkit-mask-size: 200% 140%;
    mask-size: 200% 140%;
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
    -webkit-mask-position: 100% 50%;
    mask-position: 100% 50%;
    animation: reveal-sweep-band var(--reveal-dur) cubic-bezier(0.45, 0.02, 0.3, 1) both;
  }

  .canvas-stage.reveal-wipe[data-reveal-target='vector'][data-reveal-transition='wipe-linear'] .vector-layer,
  .canvas-stage.reveal-wipe[data-reveal-target='mask'][data-reveal-transition='wipe-linear'] .mask-overlay-layer {
    -webkit-mask-image: linear-gradient(96deg, #000 0%, #000 45%, transparent 55%, transparent 100%);
    mask-image: linear-gradient(96deg, #000 0%, #000 45%, transparent 55%, transparent 100%);
    -webkit-mask-size: 200% 140%;
    mask-size: 200% 140%;
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
    -webkit-mask-position: 100% 50%;
    mask-position: 100% 50%;
    animation: reveal-sweep-band var(--reveal-dur) cubic-bezier(0.45, 0.02, 0.3, 1) both;
  }

  @keyframes reveal-sweep-band {
    from {
      -webkit-mask-position: 100% 50%;
      mask-position: 100% 50%;
    }
    to {
      -webkit-mask-position: 0% 50%;
      mask-position: 0% 50%;
    }
  }

  .canvas-stage.reveal-wipe[data-reveal-retire='raster'][data-reveal-transition='wipe-radial'] .raster-layer {
    animation: reveal-dissolve var(--reveal-dur) cubic-bezier(0.33, 0.03, 0.28, 1) both;
  }

  .canvas-stage.reveal-wipe[data-reveal-target='vector'][data-reveal-transition='wipe-radial'] .vector-layer,
  .canvas-stage.reveal-wipe[data-reveal-target='mask'][data-reveal-transition='wipe-radial'] .mask-overlay-layer {
    animation: reveal-vector-radial var(--reveal-dur) cubic-bezier(0.33, 0.03, 0.28, 1) both;
  }

  @keyframes reveal-vector-radial {
    from {
      clip-path: circle(0% at 50% 50%);
    }
    to {
      clip-path: circle(75% at 50% 50%);
    }
  }

  .canvas-stage.reveal-wipe[data-reveal-retire='raster'][data-reveal-transition='dissolve'] .raster-layer {
    animation: reveal-dissolve var(--reveal-dur) ease-in-out both;
  }

  .canvas-stage.reveal-wipe[data-reveal-target='vector'][data-reveal-transition='dissolve'] .vector-layer,
  .canvas-stage.reveal-wipe[data-reveal-target='mask'][data-reveal-transition='dissolve'] .mask-overlay-layer {
    animation: reveal-emerge var(--reveal-dur) ease-in-out both;
  }

  @keyframes reveal-dissolve {
    0% {
      opacity: 1;
    }
    70% {
      opacity: 0.18;
    }
    100% {
      opacity: 0;
    }
  }

  @keyframes reveal-emerge {
    0% {
      opacity: 0;
    }
    45% {
      opacity: 0.35;
    }
    100% {
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .canvas-stage.reveal-wipe .raster-layer,
    .canvas-stage.reveal-wipe .vector-layer,
    .canvas-stage.reveal-wipe .mask-overlay-layer {
      animation: none;
    }
    .canvas-stage.reveal-wipe[data-reveal-retire='raster'] .raster-layer {
      opacity: 0;
    }
  }

  .canvas-stage.viewport-busy .vector-layer {
    will-change: transform;
  }

  .canvas-stage.deep-zoom {
    box-shadow: none;
    border-radius: 0;
  }

  .canvas-stage.deep-zoom .stage-frame-border {
    display: none;
  }

  .canvas-stage.deep-zoom .raster-layer,
  .canvas-stage.deep-zoom .mask-overlay-layer {
    image-rendering: pixelated;
  }

  .vector-layer {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
    z-index: 3;
    overflow: visible;
  }

  .vector-layer.windowed,
  .interaction-layer.windowed,
  .raster-layer.windowed,
  .mask-overlay-layer.windowed {
    inset: auto;
    transform-origin: 0 0;
    overflow: hidden;
  }

  .interaction-layer {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
    z-index: 3;
    pointer-events: none;
    overflow: visible;
  }

  .mask-drawing-overlay {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 4;
    overflow: visible;
  }

  .active-path-outline {
    pointer-events: none;
    transition: stroke 0.15s ease, fill 0.15s ease, stroke-opacity 0.15s ease;
  }

  .hovered-outline {
    fill-opacity: 1;
  }
</style>
