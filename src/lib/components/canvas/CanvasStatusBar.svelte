<script lang="ts">
  import type { Translations } from '../../i18n';
  import type { TraceStage } from '../../workers/traceProtocol';

  interface Props {
    t: Translations['canvas'];
    isTracing: boolean;
    traceProgress?: number;
    traceFinishing?: boolean;
    traceStage?: TraceStage | null;
    contoursCount: number;
    totalNodeCount: number;
    debouncedHoveredIdx: number | null;
    hoveredContourNodesCount: number;
    hoveredContourArea: number;
    selectedIndices: number[];
    singleSelectedNodesCount: number;
    singleSelectedArea: number;
    totalSelectedNodesCount: number;
    totalSelectedArea: number;
    onClearSelection?: () => void;
  }

  let {
    t,
    isTracing,
    traceProgress = 0,
    traceFinishing = false,
    traceStage = null,
    contoursCount,
    totalNodeCount,
    debouncedHoveredIdx,
    hoveredContourNodesCount,
    hoveredContourArea,
    selectedIndices,
    singleSelectedNodesCount,
    singleSelectedArea,
    totalSelectedNodesCount,
    totalSelectedArea,
    onClearSelection
  }: Props = $props();

  function area(px: number): string {
    if (px >= 1e6) return `${(px / 1e6).toFixed(1)}M px²`;
    if (px >= 1e4) return `${Math.round(px / 1e3)}k px²`;
    return `${Math.round(px)} px²`;
  }
</script>

<div class="bottom-badges bottom-left">
  {#if isTracing}
    <div
      class="status-badge canvas-chip tracing"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={traceFinishing ? undefined : Math.round(traceProgress * 100)}
      aria-label={traceFinishing
        ? t.traceFinishing
        : traceStage
          ? t.traceStage(traceStage)
          : t.tracingStatus}
    >
      <span class="trace-label">
        {traceFinishing ? t.traceFinishing : traceStage ? t.traceStage(traceStage) : t.tracingStatus}
      </span>
      <span class="trace-track" class:indeterminate={traceFinishing}>
        <span class="trace-fill" style:--p={traceFinishing ? 1 : traceProgress}></span>
      </span>
      {#if !traceFinishing}
        <span class="trace-pct">{Math.round(traceProgress * 100)}%</span>
      {/if}
    </div>
  {:else if contoursCount > 0}
    <div
      class="status-badge canvas-chip ready"
      class:hovering={debouncedHoveredIdx !== null}
    >
      {#if debouncedHoveredIdx !== null}
        <span class="badge-highlight hover-tag">{t.pathRef(debouncedHoveredIdx + 1)}</span>
        <span class="sep">•</span>
        <span>{t.nodesCount(hoveredContourNodesCount)}</span>
        <span class="sep detail-only">•</span>
        <span class="detail-only">{area(hoveredContourArea)}</span>
      {:else}
        <span>{t.pathsCount(contoursCount)}</span>
        {#if totalNodeCount > 0}
          <span class="sep idle-detail">•</span>
          <span class="idle-detail">{t.nodesCount(totalNodeCount)}</span>
        {/if}
      {/if}
    </div>
  {/if}
</div>

{#if selectedIndices.length > 0}
  <div class="bottom-badges bottom-right">

    <div
      class="status-badge canvas-chip ready selected"
      title={selectedIndices.length === 1
        ? t.pathSelected(selectedIndices[0] + 1)
        : t.pathsSelected(selectedIndices.length)}
    >
      {#if selectedIndices.length === 1}
        <span class="badge-highlight selected-tag">{t.pathRef(selectedIndices[0] + 1)}</span>
        <span class="sep">•</span>
        <span>{t.nodesCount(singleSelectedNodesCount)}</span>
        <span class="sep detail-only">•</span>
        <span class="detail-only">{area(singleSelectedArea)}</span>
      {:else}
        <span class="badge-highlight selected-tag">{t.pathsCount(selectedIndices.length)}</span>
        <span class="sep">•</span>
        <span>{t.nodesCount(totalSelectedNodesCount)}</span>
        <span class="sep detail-only">•</span>
        <span class="detail-only">{area(totalSelectedArea)}</span>
      {/if}

      {#if onClearSelection}
        <button
          type="button"
          class="deselect-btn"
          onclick={onClearSelection}
          title={t.deselectTooltip}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          <kbd>Esc</kbd>
        </button>
      {/if}
    </div>
  </div>
{/if}

<style>
  .bottom-badges {
    position: absolute;
    bottom: 12px;
    z-index: 30;
    pointer-events: none;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .bottom-left {
    left: 12px;
  }

  .bottom-right {
    right: 12px;
  }

  .status-badge {
    transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  }

  .status-badge.tracing {
    background: rgba(37, 99, 235, 0.25);
    border: 1px solid #3b82f6;
    color: #93c5fd;
  }

  .status-badge.ready {
    background: rgba(15, 23, 42, 0.94);
    border: 1px solid #282f44;
    color: #94a3b8;
  }

  .status-badge.ready.hovering {
    border-color: #3b82f6;
    color: #e2e8f0;
    box-shadow: 0 0 16px rgba(59, 130, 246, 0.35);
  }

  .status-badge.ready.selected {
    background: rgba(30, 58, 138, 0.9);
    border-color: #60a5fa;
    color: #e2e8f0;
    box-shadow: 0 0 16px rgba(59, 130, 246, 0.45);
    pointer-events: auto;
    padding-right: 6px;
  }

  .deselect-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #cbd5e1;
    border-radius: 12px;
    padding: 2px 6px;
    font-size: 10px;
    font-weight: 700;
    cursor: pointer;
    margin-left: 4px;
    transition: all 0.12s ease;
  }

  .deselect-btn:hover {
    background: rgba(239, 68, 68, 0.3);
    border-color: #ef4444;
    color: #ffffff;
  }

  .deselect-btn kbd {
    font-family: var(--font-mono);
    font-size: 8.5px;
    background: rgba(255, 255, 255, 0.12);
    padding: 1px 3px;
    border-radius: 3px;
    color: #94a3b8;
  }

  .deselect-btn:hover kbd {
    background: rgba(255, 255, 255, 0.25);
    color: #ffffff;
  }

  .badge-highlight {
    font-weight: 800;
  }

  .hover-tag {
    color: #60a5fa;
  }

  .selected-tag {
    color: #93c5fd;
  }

  .trace-label {
    white-space: nowrap;
  }

  .trace-track {
    width: 64px;
    height: 3px;
    border-radius: 2px;
    background: rgba(148, 163, 184, 0.25);
    overflow: hidden;
    flex-shrink: 0;
  }

  .trace-fill {
    display: block;
    width: 100%;
    height: 100%;
    background: #60a5fa;
    border-radius: 2px;
    transform: scaleX(var(--p, 0));
    transform-origin: left center;
    transition: transform 0.18s linear;
  }

  .trace-track.indeterminate .trace-fill {
    width: 42%;
    transform: none;
    transition: none;
    animation: traceIndeterminate 0.9s ease-in-out infinite;
  }

  @keyframes traceIndeterminate {
    from {
      transform: translateX(-105%);
    }
    to {
      transform: translateX(245%);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .trace-fill {
      transition: none;
    }

    .trace-track.indeterminate .trace-fill {
      width: 100%;
      animation: none;
      opacity: 0.55;
    }
  }

  .trace-pct {
    font-variant-numeric: tabular-nums;
    color: #bfdbfe;
    min-width: 27px;
    text-align: right;
  }

  .sep {
    color: #475569;
    font-size: 8px;
  }

  @container workspace (max-width: 900px) {
    .bottom-badges {
      bottom: 8px;
    }

    .status-badge {
      padding: 4px 9px;
      font-size: 10px;
      gap: 5px;
      max-width: calc(100vw - 24px);
    }

    .detail-only,
    .idle-detail {
      display: none;
    }

    .trace-label {
      display: none;
    }

    .trace-track {
      width: 48px;
    }
  }

  @media (max-width: 640px) {
    .bottom-badges {
      bottom: 6px;
    }

    .bottom-left {
      left: 8px;
    }

    .bottom-right {
      right: 8px;
    }

    .status-badge {
      max-width: calc(100vw - 16px);
    }
  }

  @media (hover: none) {
    .idle-detail {
      display: none;
    }
  }
</style>
