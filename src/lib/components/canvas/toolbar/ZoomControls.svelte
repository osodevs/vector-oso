<script lang="ts">
  import type { Translations } from '../../../i18n';

  interface Props {
    t: Translations['canvas'];
    zoomLevel: number;
    hasImage: boolean;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onResetZoom: () => void;
    onFitToScreen: () => void;
  }

  let {
    t,
    zoomLevel,
    hasImage,
    onZoomIn,
    onZoomOut,
    onResetZoom,
    onFitToScreen
  }: Props = $props();
</script>

<div class="zoom-controls">
  <button
    type="button"
    class="icon-only"
    onclick={onZoomOut}
    disabled={!hasImage || zoomLevel <= 10}
    title={t.zoomOut}
  >
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  </button>
  <button
    type="button"
    class="zoom-reset-btn"
    onclick={onResetZoom}
    disabled={!hasImage}
    title={t.zoomReset}
  >
    {zoomLevel}%
  </button>
  <button
    type="button"
    class="icon-only"
    onclick={onZoomIn}
    disabled={!hasImage || zoomLevel >= 2000}
    title={t.zoomIn}
  >
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  </button>
  <button
    type="button"
    class="fit-btn icon-only"
    onclick={onFitToScreen}
    disabled={!hasImage}
    title={t.fitTooltip}
  >
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
  </button>
</div>

<style>
  .zoom-controls {
    display: flex;
    align-items: center;
    background: #141724;
    border: 1px solid #232738;
    border-radius: 7px;
    padding: 2px;
    gap: 1px;
  }

  .zoom-controls button {
    height: 24px;
    min-width: 24px;
    padding: 0 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: #94a3b8;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.12s ease;
  }

  .zoom-controls button:hover:not(:disabled) {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.08);
  }

  .zoom-controls button:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .zoom-reset-btn {
    width: auto !important;
    padding: 0 4px;
    font-family: var(--font-mono);
    font-size: 10px !important;
    color: #cbd5e1 !important;
  }

  .fit-btn {
    border-left: 1px solid #232738 !important;
    padding-left: 5px !important;
    border-radius: 0 4px 4px 0 !important;
  }
</style>
