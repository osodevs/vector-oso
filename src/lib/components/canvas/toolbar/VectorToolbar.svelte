<script lang="ts">
  import type { Translations } from '../../../i18n';
  import { clampToViewport } from '../../../actions/popoverPlacement';
  import type { NodeRenderStats } from '../../../canvas/nodeOverlays';

  interface Props {
    t: Translations['canvas'];
    vectorTool: 'move' | 'select';
    nodesMode: 'selected' | 'all' | 'off';
    nodeRenderStats?: NodeRenderStats | null;
    nodeDetailBudget?: number;
    nodeMinZoom?: number;
    hasImage: boolean;
  }

  let {
    t,
    vectorTool = $bindable(),
    nodesMode = $bindable(),
    nodeRenderStats = null,
    nodeDetailBudget = 0,
    nodeMinZoom = 0,
    hasImage
  }: Props = $props();

  const HOVER_INTENT_MS = 69;

  let isNodePopoverOpen = $state(false);
  let openTimer: ReturnType<typeof setTimeout> | null = null;
  let closeTimer: ReturnType<typeof setTimeout> | null = null;

  function handleMouseEnter() {
    if (!hasImage) return;
    if (closeTimer) clearTimeout(closeTimer);
    openTimer = setTimeout(() => {
      isNodePopoverOpen = true;
    }, HOVER_INTENT_MS);
  }

  function handleMouseLeave() {
    if (openTimer) clearTimeout(openTimer);
    closeTimer = setTimeout(() => {
      isNodePopoverOpen = false;
    }, 180);
  }

  function toggleDropdown(e: MouseEvent) {
    e.stopPropagation();
    if (!hasImage) return;
    if (openTimer) clearTimeout(openTimer);
    if (closeTimer) clearTimeout(closeTimer);
    isNodePopoverOpen = !isNodePopoverOpen;
  }

  let modeLabel = $derived.by(() => {
    switch (nodesMode) {
      case 'selected': return t.nodesModeSelected;
      case 'all': return t.nodesModeAll;
      case 'off': return t.nodesModeOff;
    }
  });

  let clipped = $derived(
    nodesMode !== 'off' &&
    !!nodeRenderStats &&
    (nodeRenderStats.belowZoom || nodeRenderStats.capped || !nodeRenderStats.detailed)
  );

  let nodeOptions = $derived([
    { id: 'selected' as const, ...t.nodesOptSelected, iconColor: '#3b82f6' },
    { id: 'all' as const, ...t.nodesOptAll, iconColor: '#60a5fa' },
    { id: 'off' as const, ...t.nodesOptOff, iconColor: '#64748b' }
  ]);
</script>

<svelte:window
  onclick={(e) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.node-dropdown-container')) {
      isNodePopoverOpen = false;
    }
  }}
  onkeydown={(e) => {
    if (e.key === 'Escape') isNodePopoverOpen = false;
  }}
/>

<div class="vector-toolbar">
  <div class="mini-control-group vector-tool-group">
    <button
      type="button"
      class="tool-btn icon-only"
      class:active={vectorTool === 'move'}
      onclick={() => (vectorTool = 'move')}
      disabled={!hasImage}
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
      class:active={vectorTool === 'select'}
      onclick={() => (vectorTool = 'select')}
      disabled={!hasImage}
      title={t.selectTool}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="m3 3 7 18 3-7 7-3L3 3z" />
      </svg>
    </button>
  </div>

  <div class="mini-control-group settings-group">

    <div
      class="node-dropdown-container"
      onmouseenter={handleMouseEnter}
      onmouseleave={handleMouseLeave}
    >
      <button
        type="button"
        class="tool-btn node-trigger-btn"
        class:active={nodesMode !== 'off'}
        class:mode-all={nodesMode === 'all'}
        class:open={isNodePopoverOpen}
        class:clipped
        onclick={toggleDropdown}
        disabled={!hasImage}
        title={t.nodesTriggerTooltip(modeLabel)}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <circle cx="5" cy="6" r="3" />
          <path d="M5 9v6" />
          <circle cx="5" cy="18" r="3" />
          <path d="M12 12h7" />
          <circle cx="19" cy="12" r="3" />
          <path d="m8 6 8 6" />
        </svg>
        <svg class="chevron-arrow" width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      {#if isNodePopoverOpen}

        <div class="node-popover-menu" use:clampToViewport onclick={(e) => e.stopPropagation()}>
          <div class="popover-title-row">
            <span>{t.nodesTitle}</span>
            <kbd>N</kbd>
          </div>

          <div class="popover-options-list">
            {#each nodeOptions as opt}
              <button
                type="button"
                class="popover-item"
                class:active={nodesMode === opt.id}
                onclick={() => {
                  nodesMode = opt.id;
                  isNodePopoverOpen = false;
                }}
              >
                <span class="node-dot" style:background={opt.iconColor}></span>
                <div class="item-text">
                  <span class="item-label">{opt.label}</span>
                  <small class="item-hint">{opt.hint}</small>
                </div>
              </button>
            {/each}
          </div>

          {#if clipped && nodeRenderStats}
            <div class="node-limit-note">
              {#if nodeRenderStats.belowZoom}
                <span>{t.nodesBelowZoom(nodeMinZoom)}</span>
              {:else}
                {#if nodeRenderStats.capped}
                  <span>{t.nodesCapped(nodeRenderStats.drawn)}</span>
                {/if}
                {#if !nodeRenderStats.detailed}
                  <span>{t.nodesNoHandles(nodeDetailBudget)}</span>
                {/if}
              {/if}
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .vector-toolbar {
    min-width: 0;
    display: flex;
    flex-direction: row-reverse;
    align-items: center;
    gap: 6px;
  }

  @container workspace (max-width: 680px) {
    .vector-toolbar {
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
    padding: 2px 4px;
    border-radius: 7px;
    gap: 2px;
  }

  .tool-btn {
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

  .tool-btn:hover:not(:disabled) {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.08);
  }

  .tool-btn.active {
    background: #2563eb;
    color: #ffffff;
    box-shadow: 0 1px 4px rgba(37, 99, 235, 0.4);
  }

  .tool-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .node-dropdown-container {
    position: relative;
    display: inline-flex;
    align-items: center;
  }

  .node-trigger-btn {
    width: auto !important;
    padding: 0 4px 0 5px;
    gap: 2px;
    border: 1px solid transparent;
  }

  .node-trigger-btn.active {
    background: rgba(37, 99, 235, 0.2);
    color: #60a5fa;
    border: 1px solid #2563eb;
  }

  .node-trigger-btn.mode-all {
    background: rgba(37, 99, 235, 0.3);
    color: #93c5fd;
    border: 1px solid #3b82f6;
    box-shadow: 0 0 8px rgba(59, 130, 246, 0.35);
  }

  .node-trigger-btn.open {
    border-color: #3b82f6;
    color: #ffffff;
  }

  .chevron-arrow {
    color: #94a3b8;
    transition: transform 0.15s ease;
    flex-shrink: 0;
  }

  .node-trigger-btn.open .chevron-arrow {
    transform: rotate(180deg);
  }

  .node-popover-menu {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    background: #0f121d;
    border: 1px solid #2b334a;
    border-radius: 10px;
    padding: 6px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 220px;
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.06);
    z-index: 200;
    backdrop-filter: blur(20px);
    animation: popoverScaleIn 0.12s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes popoverScaleIn {
    from { opacity: 0; transform: translateY(-4px) scale(0.96); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  .popover-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 3px 6px 5px;
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
    background: #1e2536;
    color: #94a3b8;
    padding: 1px 4px;
    border-radius: 3px;
    text-transform: none;
  }

  .popover-options-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .popover-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 6px 8px;
    border-radius: 6px;
    background: transparent;
    border: 1px solid transparent;
    color: #cbd5e1;
    cursor: pointer;
    text-align: left;
    transition: all 0.12s ease;
  }

  .popover-item:hover {
    background: rgba(59, 130, 246, 0.12);
    color: #ffffff;
    border-color: rgba(59, 130, 246, 0.25);
  }

  .popover-item.active {
    background: rgba(37, 99, 235, 0.22);
    color: #60a5fa;
    border-color: #3b82f6;
  }

  .node-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .item-text {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .item-label {
    font-size: 11px;
    font-weight: 700;
    line-height: 1.2;
  }

  .item-hint {
    font-size: 9.5px;
    color: #64748b;
    line-height: 1.1;
  }

  .popover-item.active .item-hint {
    color: #93c5fd;
  }

  .node-limit-note {
    display: flex;
    flex-direction: column;
    gap: 3px;
    margin-top: 5px;
    padding: 6px 6px 2px;
    border-top: 1px solid #1e2536;
    color: #94a3b8;
    font-size: 10px;
    line-height: 1.45;
  }

  .node-trigger-btn.clipped::after {
    content: '';
    position: absolute;
    top: 2px;
    right: 2px;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: #f59e0b;
  }

  .node-trigger-btn {
    position: relative;
  }
</style>
