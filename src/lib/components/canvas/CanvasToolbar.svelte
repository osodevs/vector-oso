<script lang="ts">
  import { slide } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import type { Translations } from '../../i18n';
  import type { NodeRenderStats } from '../../canvas/nodeOverlays';
  import ViewModeSettingsTrigger from './toolbar/ViewModeSettingsTrigger.svelte';
  import MaskToolbar from './toolbar/MaskToolbar.svelte';
  import VectorToolbar from './toolbar/VectorToolbar.svelte';

  interface Props {
    t: Translations['canvas'];
    viewMode: 'original' | 'mask' | 'overlay' | 'vector';
    originalColorMode: 'color' | 'grayscale';
    maskDisplayMode: 'bright' | 'dark' | 'overlay' | 'overlay-pink' | 'overlay-amber' | 'overlay-red';
    overlayColorMode: 'blue' | 'amber' | 'pink' | 'black';
    overlayBase: 'original' | 'mask-bright' | 'mask-dark';
    maskTool: 'move' | 'brush' | 'lasso';
    maskAction: 'remove' | 'add' | 'auto';
    lassoRegion: 'inside' | 'outside';
    brushRadius: number;
    vectorTool: 'move' | 'select';
    canvasBg: 'grid' | 'white' | 'dark';
    nodesMode: 'selected' | 'all' | 'off';
    nodeRenderStats?: NodeRenderStats | null;
    nodeDetailBudget?: number;
    nodeMinZoom?: number;
    selectedNodeCount?: number;
    hasImage: boolean;
    hasContours: boolean;
    totalNodeCount: number;
    canUndoMask: boolean;
    canRedoMask: boolean;
    hasMaskEdits: boolean;
    onToggleOriginal: () => void;
    onToggleMask: () => void;
    onToggleOverlay: () => void;
    onToggleVector: () => void;
    onUndoMask: () => void;
    onRedoMask: () => void;
    onResetMaskEdits: () => void;
  }

  let {
    t,
    viewMode,
    originalColorMode = $bindable(),
    maskDisplayMode = $bindable(),
    overlayColorMode = $bindable(),
    overlayBase = $bindable(),
    maskTool = $bindable(),
    maskAction = $bindable(),
    lassoRegion = $bindable(),
    brushRadius = $bindable(),
    vectorTool = $bindable(),
    canvasBg = $bindable(),
    nodesMode = $bindable(),
    nodeRenderStats = null,
    nodeDetailBudget = 0,
    nodeMinZoom = 0,
    selectedNodeCount = 0,
    hasImage,
    hasContours,
    totalNodeCount,
    canUndoMask,
    canRedoMask,
    hasMaskEdits,
    onToggleOriginal,
    onToggleMask,
    onToggleOverlay,
    onToggleVector,
    onUndoMask,
    onRedoMask,
    onResetMaskEdits
  }: Props = $props();

  let openPopover = $state<'none' | 'view-settings'>('none');

  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rowSlide = { duration: reduceMotion ? 0 : 200, easing: cubicOut };
</script>

<svelte:window
  onclick={(e) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.view-settings-trigger-wrapper')) {
      openPopover = 'none';
    }
  }}
  onkeydown={(e) => {
    if (e.key === 'Escape') openPopover = 'none';
  }}
/>

<div class="workspace-toolbar">
  <div class="toolbar-view">
    <div class="segmented-control">
      <button
        type="button"
        class="tab-btn"
        class:active={viewMode === 'original'}
        onclick={onToggleOriginal}
        disabled={!hasImage}
        title={t.viewOriginalTip}
      >
        <span>{t.viewOriginal}</span>
        <kbd>1</kbd>
      </button>

      <button
        type="button"
        class="tab-btn"
        class:active={viewMode === 'mask'}
        onclick={onToggleMask}
        disabled={!hasImage}
        title={t.viewMaskTip}
      >
        <span>{t.viewMask}</span>
        <kbd>2</kbd>
      </button>

      <button
        type="button"
        class="tab-btn"
        class:active={viewMode === 'overlay'}
        onclick={onToggleOverlay}
        disabled={!hasImage || !hasContours}
        title={t.viewOverlayTip}
      >
        <span>{t.viewOverlay}</span>
        <kbd>3</kbd>
      </button>

      <button
        type="button"
        class="tab-btn"
        class:active={viewMode === 'vector'}
        onclick={onToggleVector}
        disabled={!hasImage || !hasContours}
        title={t.viewVectorTip}
      >
        <span>{t.viewVector}</span>
        <kbd>4</kbd>
      </button>
    </div>

    <ViewModeSettingsTrigger
      {t}
      {viewMode}
      bind:originalColorMode
      bind:maskDisplayMode
      bind:overlayColorMode
      bind:overlayBase
      bind:canvasBg
      {hasImage}
      {hasContours}
      bind:openPopover
    />
  </div>

  <div class="toolbar-tools">
    {#if viewMode !== 'original'}
      <div class="tool-cluster" transition:slide={rowSlide}>
        {#if viewMode === 'mask'}
          <MaskToolbar
            {t}
            bind:maskTool
            bind:maskAction
            bind:lassoRegion
            bind:brushRadius
            {canUndoMask}
            {canRedoMask}
            {hasMaskEdits}
            {onUndoMask}
            {onRedoMask}
            {onResetMaskEdits}
          />
        {:else}
          <VectorToolbar
            {t}
            bind:vectorTool
            bind:nodesMode
            {nodeRenderStats}
            {nodeDetailBudget}
            {nodeMinZoom}
            {hasImage}
          />
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .workspace-toolbar {
    height: 38px;
    background: #0d0f17;
    border-bottom: 1px solid #1e2230;
    display: grid;
    grid-template-areas: 'view tools';
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 6px;
    padding: 0 10px;
    user-select: none;
    z-index: 40;
    position: relative;
    flex-shrink: 0;
  }

  .toolbar-view {
    grid-area: view;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .toolbar-tools {
    grid-area: tools;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
  }

  .tool-cluster {
    min-width: 0;
    display: flex;
    align-items: center;
  }

  .segmented-control {
    flex: 0 1 auto;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    background: #141724;
    padding: 2px;
    border-radius: 8px;
    border: 1px solid #232738;
    gap: 2px;
    transition: flex-grow 0.24s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .tab-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 4px 9px;
    border-radius: 6px;
    background: transparent;
    border: none;
    color: #94a3b8;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.12s ease;
    white-space: nowrap;
  }

  .tab-btn:hover:not(:disabled) {
    color: #ffffff;
  }

  .tab-btn.active {
    background: #2563eb;
    color: #ffffff;
    box-shadow: 0 1px 4px rgba(37, 99, 235, 0.4);
  }

  .tab-btn kbd {
    font-family: var(--font-mono);
    font-size: 9px;
    background: rgba(0, 0, 0, 0.25);
    padding: 1px 4px;
    border-radius: 3px;
    opacity: 0.8;
  }

  .tab-btn.active kbd {
    background: rgba(255, 255, 255, 0.25);
    color: #ffffff;
  }

  @container workspace (max-width: 680px) {
    .workspace-toolbar {
      height: auto;
      grid-template-areas:
        'view'
        'tools';
      grid-template-columns: 1fr;
      row-gap: 6px;
      padding: 6px 10px;
    }

    .toolbar-tools {
      justify-content: space-between;
    }

    .tool-cluster {
      flex: 1;
    }

    .segmented-control {
      flex-grow: 1;
    }

    .toolbar-tools {
      animation: toolbarRowFoldOut 0.24s cubic-bezier(0.22, 1, 0.36, 1) both;
    }

    .tab-btn {
      padding: 5px 3px;
      text-align: center;
    }
  }

  @container workspace (max-width: 560px) {
    .tab-btn kbd {
      display: none;
    }

    .tab-btn {
      padding: 5px 1px;
      font-size: 10px;
    }
  }

  @keyframes toolbarRowFoldOut {
    from {
      opacity: 0;
      transform: translateY(-6px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .segmented-control {
      transition: none;
    }

    .toolbar-tools {
      animation: none;
    }
  }
</style>
