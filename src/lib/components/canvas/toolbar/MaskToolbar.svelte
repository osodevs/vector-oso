<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { Translations } from '../../../i18n';
  import { clampToViewport } from '../../../actions/popoverPlacement';

  interface Props {
    t: Translations['canvas'];
    maskTool: 'move' | 'brush' | 'lasso';
    maskAction: 'remove' | 'add' | 'auto';
    lassoRegion: 'inside' | 'outside';
    brushRadius: number;
    canUndoMask: boolean;
    canRedoMask: boolean;
    hasMaskEdits: boolean;
    onUndoMask: () => void;
    onRedoMask: () => void;
    onResetMaskEdits: () => void;
  }

  let {
    t,
    maskTool = $bindable(),
    maskAction = $bindable(),
    lassoRegion = $bindable(),
    brushRadius = $bindable(),
    canUndoMask,
    canRedoMask,
    hasMaskEdits,
    onUndoMask,
    onRedoMask,
    onResetMaskEdits
  }: Props = $props();

  const HOVER_INTENT_MS = 69;

  let isBrushPopoverOpen = $state(false);
  let openTimer: ReturnType<typeof setTimeout> | null = null;
  let closeTimer: ReturnType<typeof setTimeout> | null = null;

  function handleMouseEnter() {
    if (closeTimer) clearTimeout(closeTimer);
    openTimer = setTimeout(() => {
      isBrushPopoverOpen = true;
    }, HOVER_INTENT_MS);
  }

  function handleMouseLeave() {
    if (openTimer) clearTimeout(openTimer);
    closeTimer = setTimeout(() => {
      isBrushPopoverOpen = false;
    }, 180);
  }

  function toggleBrushPopover(e: MouseEvent) {
    e.stopPropagation();
    if (openTimer) clearTimeout(openTimer);
    if (closeTimer) clearTimeout(closeTimer);
    isBrushPopoverOpen = !isBrushPopoverOpen;
  }

  let outsideActive = $derived(maskTool === 'lasso' && lassoRegion === 'outside');

  const actionTitle = (base: string) => (outsideActive ? `${base} — ${t.lassoOutsideSuffix}` : base);

  $effect(() => {
    if (maskTool !== 'brush') isBrushPopoverOpen = false;
  });
</script>

{#snippet minusGlyph()}
  <line x1="5" y1="12" x2="19" y2="12" />
{/snippet}

{#snippet plusGlyph()}
  <line x1="12" y1="5" x2="12" y2="19" />
  <line x1="5" y1="12" x2="19" y2="12" />
{/snippet}

{#snippet autoGlyph()}
  <path d="m13 2-2 2.5h3L11 9l4.5-1L11 14l5-1.5L9 22l2-7H8l3-5-4 1L13 2Z" />
{/snippet}

{#snippet actionIcon(glyph: Snippet, strokeWidth: number)}
  <svg
    width="11"
    height="11"
    viewBox="0 0 24 24"
    fill="none"
    stroke={outsideActive ? 'var(--btn-bg)' : 'currentColor'}
    stroke-width={strokeWidth}
  >
    {#if outsideActive}
      <rect x="1" y="1" width="22" height="22" rx="5" fill="currentColor" stroke="none" />
    {/if}
    {@render glyph()}
  </svg>
{/snippet}

<svelte:window
  onclick={(e) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.brush-dropdown-container')) isBrushPopoverOpen = false;
  }}
  onkeydown={(e) => {
    if (e.key === 'Escape') isBrushPopoverOpen = false;
  }}
/>

<div class="mask-toolbar">
    <div class="mini-control-group main-tool-group">
    <button
      type="button"
      class="tool-btn icon-only"
      class:active={maskTool === 'move'}
      onclick={() => (maskTool = 'move')}
      title={t.handTool}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v3" />
        <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v7" />
        <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
        <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
      </svg>
    </button>
    <button
      type="button"
      class="tool-btn icon-only"
      class:active={maskTool === 'brush'}
      onclick={() => (maskTool = 'brush')}
      title={t.brush}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="m18 11 2-2a2 2 0 0 0-2.83-2.83l-8.6 8.6a2 2 0 0 0-.5 1l-.5 4.5 4.5-.5a2 2 0 0 0 1-.5l6.43-6.43Z" />
      </svg>
    </button>
    <button
      type="button"
      class="tool-btn icon-only"
      class:active={maskTool === 'lasso'}
      onclick={() => (maskTool = 'lasso')}
      title={t.lasso}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 10.5C4 6.9 7.5 4 12 4s8 2.9 8 6.5S16.5 17 12 17s-8-2.9-8-6.5Z" />
        <path d="M10.8 17c1.8 0 3.2.5 3.8 1.4.5.8.1 1.8-.9 2.1-1.2.4-2.4-.3-2.9-1.4" />
      </svg>
    </button>
  </div>

<div class="mini-control-group settings-group">

    {#if maskTool === 'lasso'}
      <div class="region-group">
        <button
          type="button"
          class="action-btn region-btn icon-only"
          class:active={lassoRegion === 'inside'}
          onclick={() => (lassoRegion = 'inside')}
          title={t.lassoInsideTooltip}
          aria-pressed={lassoRegion === 'inside'}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="3" stroke-dasharray="3 3" opacity="0.55" />
            <circle cx="12" cy="12" r="5" fill="currentColor" stroke="none" />
          </svg>
        </button>
        <button
          type="button"
          class="action-btn region-btn icon-only"
          class:active={lassoRegion === 'outside'}
          onclick={() => (lassoRegion = 'outside')}
          title={t.lassoOutsideTooltip}
          aria-pressed={lassoRegion === 'outside'}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path
              d="M3 3h18v18H3Z M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z"
              fill="currentColor"
              fill-rule="evenodd"
              stroke="none"
              opacity="0.85"
            />
            <circle cx="12" cy="12" r="5" stroke-dasharray="3 3" opacity="0.55" />
          </svg>
        </button>
      </div>
    {/if}
    {#if maskTool === 'brush'}

      <div
        class="brush-dropdown-container"
        onmouseenter={handleMouseEnter}
        onmouseleave={handleMouseLeave}
      >
        <button
          type="button"
          class="action-btn brush-trigger-btn"
          class:open={isBrushPopoverOpen}
          onclick={toggleBrushPopover}
          title={t.brushSizeTooltip(brushRadius)}
        >
          <span class="brush-size-value">{brushRadius}</span>
          <svg class="chevron-arrow" width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {#if isBrushPopoverOpen}

          <div class="brush-popover-menu" use:clampToViewport onclick={(e) => e.stopPropagation()}>
            <div class="popover-title-row">
              <span>{t.brushSizeTitle}</span>
              <kbd>[ ]</kbd>
            </div>
            <div class="brush-popover-body">
              <input
                type="range"
                min="1"
                max="60"
                step="1"
                bind:value={brushRadius}
                class="brush-slider"
                title={t.brushSizeTooltip(brushRadius)}
              />
              <span class="brush-size-label">{brushRadius}px</span>
            </div>
          </div>
        {/if}
      </div>
    {/if}

    {#if maskTool !== 'move'}
      <div class="mini-divider"></div>
    {/if}

    <button
      type="button"
      class="action-btn remove-action icon-only"
      class:active={maskAction === 'remove'}
      onclick={() => (maskAction = 'remove')}
      title={actionTitle(t.brushErase)}
    >
      {@render actionIcon(minusGlyph, 3.5)}
    </button>
    <button
      type="button"
      class="action-btn add-action icon-only"
      class:active={maskAction === 'add'}
      onclick={() => (maskAction = 'add')}
      title={actionTitle(t.brushAdd)}
    >
      {@render actionIcon(plusGlyph, 3.5)}
    </button>
    <button
      type="button"
      class="action-btn auto-action icon-only"
      class:active={maskAction === 'auto'}
      onclick={() => (maskAction = 'auto')}
      title={actionTitle(t.brushAuto)}
    >
      {@render actionIcon(autoGlyph, 2.5)}
    </button>

    <div class="mini-divider"></div>

    <button
      type="button"
      class="history-btn icon-only"
      onclick={onUndoMask}
      disabled={!canUndoMask}
      title={t.undo}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M3 7v6h6" />
        <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
      </svg>
    </button>
    <button
      type="button"
      class="history-btn icon-only"
      onclick={onRedoMask}
      disabled={!canRedoMask}
      title={t.redo}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M21 7v6h-6" />
        <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
      </svg>
    </button>

    {#if hasMaskEdits}
      <button
        type="button"
        class="reset-mask-btn icon-only"
        onclick={onResetMaskEdits}
        title={t.clearMaskTooltip}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      </button>
    {/if}
  </div>
</div>

<style>
  .mask-toolbar {
    min-width: 0;
    display: flex;
    flex-direction: row-reverse;
    align-items: center;
    gap: 6px;
  }

  @container workspace (max-width: 680px) {
    .mask-toolbar {
      flex: 1;
      flex-direction: row;
      justify-content: space-between;
    }
  }

  .mini-control-group {
    display: flex;
    align-items: center;
    background: #141724;
    border: 1px solid #232738;
    padding: 2px;
    border-radius: 7px;
    gap: 2px;
  }

  .action-btn,
  .tool-btn {
    --btn-bg: #141724;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 5px;
    background: transparent;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    transition: all 0.12s ease;
  }

  .action-btn:hover,
  .tool-btn:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.08);
  }

  .action-btn.active,
  .tool-btn.active {
    --btn-bg: #2563eb;
    background: #2563eb;
    color: #ffffff;
    box-shadow: 0 1px 4px rgba(37, 99, 235, 0.4);
  }

  .remove-action.active {
    --btn-bg: #ef4444;
    background: #ef4444;
    box-shadow: 0 1px 4px rgba(239, 68, 68, 0.4);
  }

  .add-action.active {
    --btn-bg: #10b981;
    background: #10b981;
    box-shadow: 0 1px 4px rgba(16, 185, 129, 0.4);
  }

  .auto-action.active {
    --btn-bg: #8b5cf6;
    background: #8b5cf6;
    box-shadow: 0 1px 4px rgba(139, 92, 246, 0.4);
  }

  .region-group {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .region-btn.active {
    --btn-bg: #313a53;
    background: #313a53;
    color: #e2e8f0;
    box-shadow: none;
  }

  .brush-dropdown-container {
    position: relative;
    display: inline-flex;
    align-items: center;
  }

  .brush-trigger-btn {
    width: auto !important;
    padding: 0 4px 0 6px;
    gap: 2px;
    border: 1px solid transparent;
    background: rgba(0, 0, 0, 0.25);
  }

  .brush-trigger-btn.open {
    border-color: #3b82f6;
    color: #ffffff;
  }

  .brush-size-value {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
  }

  .chevron-arrow {
    color: #94a3b8;
    flex-shrink: 0;
  }

  .brush-popover-menu {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    z-index: 200;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 6px;
    min-width: 172px;
    background: #0f121d;
    border: 1px solid #2b334a;
    border-radius: 10px;
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08);
  }

  .popover-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 3px 4px 5px;
    border-bottom: 1px solid #1e2536;
    font-size: 10px;
    font-weight: 800;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .popover-title-row kbd {
    font-family: var(--font-mono);
    font-size: 9px;
    background: #1b2133;
    border-radius: 3px;
    padding: 1px 4px;
    color: #94a3b8;
  }

  .brush-popover-body {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 2px 4px 4px;
  }

  .brush-size-label {
    font-family: var(--font-mono);
    font-size: 10px;
    color: #cbd5e1;
    min-width: 24px;
    text-align: right;
  }

  .brush-slider {
    flex: 1;
    min-width: 92px;
    height: 3px;
    accent-color: #3b82f6;
    cursor: ew-resize;
  }

  .mini-divider {
    width: 1px;
    height: 14px;
    background: #232738;
    margin: 0 2px;
  }

  .history-btn,
  .reset-mask-btn {
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    background: transparent;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    transition: all 0.12s ease;
  }

  .history-btn:hover:not(:disabled),
  .reset-mask-btn:hover:not(:disabled) {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.06);
  }

  .history-btn:disabled,
  .reset-mask-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .reset-mask-btn:hover {
    color: #ef4444 !important;
    background: rgba(239, 68, 68, 0.12) !important;
  }
</style>
