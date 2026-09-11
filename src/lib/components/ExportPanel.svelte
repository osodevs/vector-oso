<script lang="ts">
  import type { Translations } from '../i18n';

  interface Props {
    t: Translations['export'];
    disabled: boolean;
    onExport: (format: 'pdf' | 'svg' | 'eps' | 'dxf' | 'png') => void;
  }

  let { t, disabled, onExport }: Props = $props();

  let isOpen = $state<boolean>(false);
  let openTimer: any = null;
  let closeTimer: any = null;

  function toggleOpen(e: MouseEvent) {
    e.stopPropagation();
    if (disabled) return;
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
    isOpen = !isOpen;
  }

  function handleToggleEnter() {
    if (disabled) return;
    clearTimeout(closeTimer);
    openTimer = setTimeout(() => {
      isOpen = true;
    }, 100);
  }

  function handleWrapEnter() {
    clearTimeout(closeTimer);
  }

  function handleWrapLeave() {
    clearTimeout(openTimer);
    closeTimer = setTimeout(() => {
      isOpen = false;
    }, 160);
  }

  function handleInstantClose() {
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
    isOpen = false;
  }

  function handleSelect(format: 'pdf' | 'svg' | 'eps' | 'dxf' | 'png') {
    handleInstantClose();
    onExport(format);
  }

  function handleWindowClick() {
    handleInstantClose();
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      handleInstantClose();
    }
  }
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleKeyDown} />

<div class="export-panel">

  <div
    class="export-dropup-wrap"
    class:open={isOpen}
    onmouseenter={handleWrapEnter}
    onmouseleave={handleWrapLeave}
  >
    {#if isOpen}

      <div class="mobile-menu-backdrop" onclick={handleInstantClose}></div>

      <div
        class="export-dropup-menu"
        onmouseenter={handleWrapEnter}
        onmouseleave={handleWrapLeave}
        onclick={(e) => e.stopPropagation()}
      >
        <div class="menu-header">
          <span>Dateiformat wählen</span>
          <span class="menu-hint">Vektor & Raster</span>
        </div>

        <button
          type="button"
          class="menu-item featured"
          onclick={() => handleSelect('svg')}
        >
          <div class="item-left">
            <span class="format-badge svg">SVG</span>
            <div class="item-labels">
              <strong>{t.svgTitle}</strong>
              <small>Web, Figma, Schneidplotter</small>
            </div>
          </div>
          <span class="item-ext-pill">{t.svgSubtitle}</span>
        </button>

        <button
          type="button"
          class="menu-item"
          onclick={() => handleSelect('pdf')}
        >
          <div class="item-left">
            <span class="format-badge pdf">PDF</span>
            <div class="item-labels">
              <strong>{t.pdfTitle}</strong>
              <small>Druck, Dokumente, Illustrator</small>
            </div>
          </div>
          <span class="item-ext-pill">{t.pdfSubtitle}</span>
        </button>

        <button
          type="button"
          class="menu-item"
          onclick={() => handleSelect('png')}
        >
          <div class="item-left">
            <span class="format-badge png">PNG</span>
            <div class="item-labels">
              <strong>{t.pngTitle}</strong>
              <small>Transparentes 1-Bit Pixelraster</small>
            </div>
          </div>
          <span class="item-ext-pill">{t.pngSubtitle}</span>
        </button>

        <button
          type="button"
          class="menu-item"
          onclick={() => handleSelect('eps')}
        >
          <div class="item-left">
            <span class="format-badge eps">EPS</span>
            <div class="item-labels">
              <strong>{t.epsTitle}</strong>
              <small>PostScript Druckvorstufe</small>
            </div>
          </div>
          <span class="item-ext-pill">{t.epsSubtitle}</span>
        </button>

        <button
          type="button"
          class="menu-item"
          onclick={() => handleSelect('dxf')}
        >
          <div class="item-left">
            <span class="format-badge dxf">DXF</span>
            <div class="item-labels">
              <strong>{t.dxfTitle}</strong>
              <small>Laser, CNC, LightBurn</small>
            </div>
          </div>
          <span class="item-ext-pill">{t.dxfSubtitle}</span>
        </button>
      </div>
    {/if}

    <div class="export-split-button" class:disabled>
      <button
        type="button"
        class="export-primary-btn"
        onclick={(e) => {
          if (typeof window !== 'undefined' && window.innerWidth <= 900) {
            toggleOpen(e);
          } else {
            onExport('svg');
          }
        }}
        {disabled}
        title={t.btnExport}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
        </svg>
        <span class="btn-title">Export</span>
        <span class="btn-ext-tag">SVG</span>
      </button>

      <button
        type="button"
        class="export-toggle-btn desktop-toggle"
        onclick={toggleOpen}
        onmouseenter={handleToggleEnter}
        onfocus={handleToggleEnter}
        onblur={handleInstantClose}
        {disabled}
        title={t.allFormats}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class:flip={isOpen}>
          <path d="m18 15-6-6-6 6"/>
        </svg>
      </button>
    </div>
  </div>
</div>

<style>
  .export-panel {
    padding: 12px 14px;
    background: #11131a;
    border-top: 1px solid #1f2330;
    flex-shrink: 0;
  }

  .export-dropup-wrap {
    position: relative;
    width: 100%;
  }

  .export-split-button {
    display: flex;
    align-items: stretch;
    height: 44px;
    border-radius: 10px;
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    border: 1px solid #3b82f6;
    box-shadow: 0 4px 16px rgba(37, 99, 235, 0.35);
    transition: all 0.16s ease;
  }

  .export-split-button:hover:not(.disabled) {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    border-color: #60a5fa;
    box-shadow: 0 6px 24px rgba(59, 130, 246, 0.45);
    transform: translateY(-1px);
  }

  .export-split-button.disabled {
    opacity: 0.35;
    cursor: not-allowed;
    background: #181b26;
    border-color: #282c3c;
    box-shadow: none;
  }

  .export-primary-btn {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 14px;
    border: 0;
    border-right: 1px solid rgba(255, 255, 255, 0.22);
    border-radius: 9px 0 0 9px;
    background: transparent;
    color: #ffffff;
    font-size: 13px;
    font-weight: 750;
    cursor: pointer;
    transition: all 0.14s ease;
  }

  .export-primary-btn svg {
    color: #ffffff;
    flex-shrink: 0;
  }

  .btn-title {
    white-space: nowrap;
    letter-spacing: -0.01em;
  }

  .btn-ext-tag {
    font-family: var(--font-mono);
    font-size: 9.5px;
    font-weight: 800;
    color: #ffffff;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.4);
    padding: 1px 6px;
    border-radius: 4px;
  }

  .export-toggle-btn {
    width: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 0;
    border-radius: 0 9px 9px 0;
    background: transparent;
    color: #ffffff;
    cursor: pointer;
    transition: all 0.14s ease;
  }

  .export-toggle-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.18);
    color: #ffffff;
  }

  .export-toggle-btn svg {
    transition: transform 0.18s ease;
  }

  .export-toggle-btn svg.flip {
    transform: rotate(180deg);
  }

  .export-dropup-menu {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 0;
    right: 0;
    background: #141724;
    border: 1px solid #282c3c;
    border-radius: 12px;
    padding: 6px;
    box-shadow: 0 -12px 36px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05);
    z-index: 100;
    display: flex;
    flex-direction: column;
    gap: 3px;
    animation: dropupFadeIn 0.14s ease-out;
  }

  .export-dropup-menu::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    height: 14px;
    background: transparent;
  }

  @keyframes dropupFadeIn {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .menu-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 8px 4px;
    font-size: 10px;
    font-weight: 700;
    color: #94a3b8;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    margin-bottom: 2px;
  }

  .menu-hint {
    font-family: var(--font-mono);
    font-size: 8.5px;
    color: #64748b;
    letter-spacing: 0.05em;
  }

  .menu-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 7px 8px;
    border-radius: 8px;
    border: 1px solid transparent;
    background: transparent;
    color: #f3f4f6;
    cursor: pointer;
    text-align: left;
    transition: all 0.12s ease;
  }

  .menu-item:hover {
    background: #1c2032;
    border-color: #3b82f6;
  }

  .menu-item.featured {
    background: rgba(37, 99, 235, 0.1);
    border-color: rgba(59, 130, 246, 0.3);
  }

  .menu-item.featured:hover {
    background: rgba(37, 99, 235, 0.2);
    border-color: #3b82f6;
  }

  .item-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .format-badge {
    font-family: var(--font-mono);
    font-size: 9px;
    font-weight: 800;
    padding: 2px 6px;
    border-radius: 5px;
    letter-spacing: 0.04em;
    min-width: 32px;
    text-align: center;
  }

  .format-badge.svg { background: rgba(37, 99, 235, 0.25); color: #93c5fd; border: 1px solid rgba(59, 130, 246, 0.5); }
  .format-badge.pdf { background: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.4); }
  .format-badge.png { background: rgba(16, 185, 129, 0.2); color: #6ee7b7; border: 1px solid rgba(16, 185, 129, 0.4); }
  .format-badge.eps { background: rgba(245, 158, 11, 0.2); color: #fde68a; border: 1px solid rgba(245, 158, 11, 0.4); }
  .format-badge.dxf { background: rgba(168, 85, 247, 0.2); color: #d8b4fe; border: 1px solid rgba(168, 85, 247, 0.4); }

  .item-labels {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .item-labels strong {
    font-size: 11.5px;
    font-weight: 700;
    color: #f1f5f9;
    line-height: 1.2;
  }

  .item-labels small {
    font-size: 9.5px;
    color: #94a3b8;
    line-height: 1.1;
  }

  .item-ext-pill {
    font-family: var(--font-mono);
    font-size: 9px;
    font-weight: 700;
    color: #64748b;
    background: rgba(0, 0, 0, 0.3);
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.06);
  }

  .mobile-menu-backdrop {
    display: none;
  }

  @media (max-width: 900px) {
    .export-panel {
      padding: 8px 10px;
    }

    .export-split-button {
      height: 38px;
    }

    .export-primary-btn {
      padding: 0 10px;
      font-size: 12px;
      border-right: none;
      border-radius: 9px;
      justify-content: center;
    }

    .desktop-toggle {
      display: none;
    }

    .mobile-menu-backdrop {
      display: block;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      z-index: 99;
    }

    .export-dropup-menu {
      position: fixed;
      bottom: calc(var(--dock-h, 44px) + var(--sheet-edge-h, 20px) + 10px);
      left: 12px;
      right: 12px;
      width: auto;
      max-width: 380px;
      margin: 0 auto;
      z-index: 100;
      padding: 8px;
      border-radius: 16px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1);
    }

    .menu-item {
      padding: 10px 10px;
    }

    .item-labels strong {
      font-size: 12.5px;
    }

    .item-labels small {
      font-size: 10.5px;
    }
  }
</style>
