<script lang="ts">
  import { clampToViewport } from '../../../actions/popoverPlacement';
  import type { Translations } from '../../../i18n';

  interface Props {
    t: Translations['canvas'];
    viewMode: 'original' | 'mask' | 'overlay' | 'vector';
    originalColorMode: 'color' | 'grayscale';
    maskDisplayMode: 'bright' | 'dark' | 'overlay' | 'overlay-pink' | 'overlay-amber' | 'overlay-red';
    overlayColorMode: 'blue' | 'amber' | 'pink' | 'black';
    overlayBase: 'original' | 'mask-bright' | 'mask-dark';
    canvasBg: 'grid' | 'white' | 'dark';
    hasImage: boolean;
    hasContours: boolean;
    openPopover: string;
  }

  let {
    t,
    viewMode,
    originalColorMode = $bindable(),
    maskDisplayMode = $bindable(),
    overlayColorMode = $bindable(),
    overlayBase = $bindable(),
    canvasBg = $bindable(),
    hasImage,
    hasContours,
    openPopover = $bindable()
  }: Props = $props();

  let vs = $derived(t.viewSettings);

  const HOVER_INTENT_MS = 69;

  let openTimer: ReturnType<typeof setTimeout> | null = null;
  let closeTimer: ReturnType<typeof setTimeout> | null = null;

  function handleMouseEnter() {
    if (!hasImage) return;
    if (closeTimer) clearTimeout(closeTimer);
    openTimer = setTimeout(() => {
      openPopover = 'view-settings';
    }, HOVER_INTENT_MS);
  }

  function handleMouseLeave() {
    if (openTimer) clearTimeout(openTimer);
    closeTimer = setTimeout(() => {
      if (openPopover === 'view-settings') openPopover = 'none';
    }, 180);
  }

  function toggleSettings(e: MouseEvent) {
    e.stopPropagation();
    if (!hasImage) return;
    if (openTimer) clearTimeout(openTimer);
    if (closeTimer) clearTimeout(closeTimer);
    openPopover = openPopover === 'view-settings' ? 'none' : 'view-settings';
  }

  let originalOptions = $derived([
    { id: 'color', ...vs.origColor, iconClass: 'swatch-color' },
    { id: 'grayscale', ...vs.origGray, iconClass: 'swatch-gray' }
  ]);

  let maskOptions = $derived([
    { id: 'bright', ...vs.maskBright, iconClass: 'swatch-white' },
    { id: 'dark', ...vs.maskDark, iconClass: 'swatch-dark' },
    { id: 'overlay', ...vs.maskOverlay, iconClass: 'swatch-overlay' },
    { id: 'overlay-pink', ...vs.maskOverlayPink, iconClass: 'swatch-pink' },
    { id: 'overlay-amber', ...vs.maskOverlayAmber, iconClass: 'swatch-amber' },
    { id: 'overlay-red', ...vs.maskOverlayRed, iconClass: 'swatch-red' }
  ]);

  let overlayOptions = $derived([
    { id: 'blue', ...vs.ovBlue, iconClass: 'swatch-blue' },
    { id: 'amber', ...vs.ovAmber, iconClass: 'swatch-amber' },
    { id: 'pink', ...vs.ovPink, iconClass: 'swatch-pink' },
    { id: 'black', ...vs.ovBlack, iconClass: 'swatch-black' }
  ]);

  let overlayBaseOptions = $derived([
    { id: 'original', ...vs.baseOriginal, iconClass: 'swatch-color' },
    { id: 'mask-bright', ...vs.baseMaskBright, iconClass: 'swatch-white' },
    { id: 'mask-dark', ...vs.baseMaskDark, iconClass: 'swatch-dark' }
  ]);

  let vectorOptions = $derived([
    { id: 'grid', ...vs.bgGrid, iconClass: 'swatch-grid' },
    { id: 'white', ...vs.bgWhite, iconClass: 'swatch-white' },
    { id: 'dark', ...vs.bgDark, iconClass: 'swatch-dark' }
  ]);

  let activeIconClass = $derived.by(() => {
    switch (viewMode) {
      case 'original':
        return originalColorMode === 'color' ? 'swatch-color' : 'swatch-gray';
      case 'mask':
        switch (maskDisplayMode) {
          case 'dark': return 'swatch-dark';
          case 'overlay': return 'swatch-overlay';
          case 'overlay-pink': return 'swatch-pink';
          case 'overlay-amber': return 'swatch-amber';
          case 'overlay-red': return 'swatch-red';
          default: return 'swatch-white';
        }
      case 'overlay':
        switch (overlayColorMode) {
          case 'amber': return 'swatch-amber';
          case 'pink': return 'swatch-pink';
          case 'black': return 'swatch-black';
          default: return 'swatch-blue';
        }
      case 'vector':
        switch (canvasBg) {
          case 'white': return 'swatch-white';
          case 'dark': return 'swatch-dark';
          default: return 'swatch-grid';
        }
    }
  });

  let currentSettingsTitle = $derived.by(() => {
    switch (viewMode) {
      case 'original': return vs.titleOriginal;
      case 'mask': return vs.titleMask;
      case 'overlay': return vs.titleOverlayColor;
      case 'vector': return vs.titleVector;
    }
  });
</script>

<div
  class="view-settings-trigger-wrapper"
  onmouseenter={handleMouseEnter}
  onmouseleave={handleMouseLeave}
>
  <button
    type="button"
    class="settings-trigger-btn"
    class:open={openPopover === 'view-settings'}
    onclick={toggleSettings}
    disabled={!hasImage}
    title={vs.cycleTooltip(currentSettingsTitle, 'Q')}
  >
    <span class="swatch-icon {activeIconClass}"></span>
    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
      <path d="m6 9 6 6 6-6"/>
    </svg>
  </button>

  {#if openPopover === 'view-settings'}

    <div class="settings-popover-menu" use:clampToViewport onclick={(e) => e.stopPropagation()}>
      <div class="popover-title-row">
        <span>{currentSettingsTitle}</span>
        <kbd>Q</kbd>
      </div>

      <div class="popover-options-list">
        {#if viewMode === 'original'}
          {#each originalOptions as opt}
            <button
              type="button"
              class="popover-item"
              class:active={originalColorMode === opt.id}
              onclick={() => { originalColorMode = opt.id as any; openPopover = 'none'; }}
            >
              <span class="swatch-icon {opt.iconClass}"></span>
              <div class="item-text">
                <span class="item-label">{opt.label}</span>
                <small class="item-hint">{opt.hint}</small>
              </div>
            </button>
          {/each}
        {:else if viewMode === 'mask'}
          {#each maskOptions as opt}
            <button
              type="button"
              class="popover-item"
              class:active={maskDisplayMode === opt.id}
              onclick={() => { maskDisplayMode = opt.id as any; openPopover = 'none'; }}
            >
              <span class="swatch-icon {opt.iconClass}"></span>
              <div class="item-text">
                <span class="item-label">{opt.label}</span>
                <small class="item-hint">{opt.hint}</small>
              </div>
            </button>
          {/each}
        {:else if viewMode === 'overlay'}
          {#each overlayOptions as opt}
            <button
              type="button"
              class="popover-item"
              class:active={overlayColorMode === opt.id}
              onclick={() => { overlayColorMode = opt.id as any; openPopover = 'none'; }}
            >
              <span class="swatch-icon {opt.iconClass}"></span>
              <div class="item-text">
                <span class="item-label">{opt.label}</span>
                <small class="item-hint">{opt.hint}</small>
              </div>
            </button>
          {/each}

          <div class="popover-group-row">
            <span>{vs.titleOverlayBase}</span>
            <kbd>W</kbd>
          </div>

          {#each overlayBaseOptions as opt}
            <button
              type="button"
              class="popover-item"
              class:active={overlayBase === opt.id}
              onclick={() => { overlayBase = opt.id as any; openPopover = 'none'; }}
            >
              <span class="swatch-icon {opt.iconClass}"></span>
              <div class="item-text">
                <span class="item-label">{opt.label}</span>
                <small class="item-hint">{opt.hint}</small>
              </div>
            </button>
          {/each}
        {:else if viewMode === 'vector'}
          {#each vectorOptions as opt}
            <button
              type="button"
              class="popover-item"
              class:active={canvasBg === opt.id}
              onclick={() => { canvasBg = opt.id as any; openPopover = 'none'; }}
            >
              <span class="swatch-icon {opt.iconClass}"></span>
              <div class="item-text">
                <span class="item-label">{opt.label}</span>
                <small class="item-hint">{opt.hint}</small>
              </div>
            </button>
          {/each}
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .view-settings-trigger-wrapper {
    position: relative;
    display: inline-flex;
    align-items: center;
  }

  .settings-trigger-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    height: 26px;
    padding: 0 5px 0 6px;
    border-radius: 6px;
    background: #141724;
    border: 1px solid #282f44;
    color: #94a3b8;
    cursor: pointer;
    transition: all 0.12s ease;
  }

  .settings-trigger-btn:hover:not(:disabled),
  .settings-trigger-btn.open {
    background: #1f2537;
    border-color: #3b82f6;
    color: #ffffff;
  }

  .settings-trigger-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .settings-trigger-btn svg {
    color: #94a3b8;
    transition: transform 0.15s ease;
  }

  .settings-trigger-btn.open svg {
    transform: rotate(180deg);
  }

  .swatch-icon {
    width: 13px;
    height: 13px;
    border-radius: 3px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    display: inline-block;
    flex-shrink: 0;
  }

  .swatch-white { background: #ffffff; }
  .swatch-dark { background: #12131b; }
  .swatch-blue { background: #2563eb; border-color: #60a5fa; }
  .swatch-amber { background: #f59e0b; border-color: #fbbf24; }
  .swatch-pink { background: #ec4899; border-color: #f472b6; }
  .swatch-red { background: #ef4444; border-color: #f87171; }
  .swatch-black { background: #000000; border-color: #52525b; }

  .swatch-grid {
    background-image: linear-gradient(45deg, #bbb 25%, transparent 25%),
      linear-gradient(-45deg, #bbb 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #bbb 75%),
      linear-gradient(-45deg, transparent 75%, #bbb 75%);
    background-size: 6px 6px;
    background-color: #fff;
  }

  .swatch-overlay {
    background: linear-gradient(135deg, #2563eb 50%, #475569 50%);
    border-color: #3b82f6;
  }

  .swatch-color {
    background: linear-gradient(135deg, #ef4444 0%, #3b82f6 50%, #10b981 100%);
    border-color: rgba(255, 255, 255, 0.4);
  }

  .swatch-gray {
    background: linear-gradient(135deg, #94a3b8 0%, #475569 100%);
    border-color: rgba(255, 255, 255, 0.3);
  }

  .settings-popover-menu {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    background: #0f121d;
    border: 1px solid #2b334a;
    border-radius: 10px;
    padding: 6px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 210px;
    max-width: min(280px, calc(100vw - 20px));
    max-height: min(430px, calc(85vh - 56px));
    overflow-y: auto;
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08);
    z-index: 200;
    backdrop-filter: blur(20px);
    animation: popoverScaleIn 0.12s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .settings-popover-menu::-webkit-scrollbar {
    width: 4px;
  }

  .settings-popover-menu::-webkit-scrollbar-track {
    background: transparent;
  }

  .settings-popover-menu::-webkit-scrollbar-thumb {
    background: #282f44;
    border-radius: 2px;
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

  .popover-group-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 6px;
    padding: 6px 6px 5px;
    border-top: 1px solid #1e2536;
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
</style>
