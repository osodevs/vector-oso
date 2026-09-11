<script lang="ts">
  import type { Locale, Translations } from '../i18n';
  import Logo from './Logo.svelte';
  import { installPrompt, showInstallPrompt } from '../core/installPrompt.svelte';

  interface Props {
    tBrand: Translations['brand'];
    tPwa: Translations['pwa'];
    locale: Locale;
    hasImage: boolean;
    isProcessing: boolean;
    statusText: string;
    statusTone?: 'info' | 'error';
    onLocaleChange: (loc: Locale) => void;
  }

  let {
    tBrand,
    tPwa,
    locale,
    hasImage,
    isProcessing,
    statusText,
    statusTone = 'info',
    onLocaleChange
  }: Props = $props();

  let showStatus = $derived(statusTone === 'error' && statusText.length > 0);

  let isPrivacyModalOpen = $state(false);

  function togglePrivacyModal(e: MouseEvent) {
    e.stopPropagation();
    isPrivacyModalOpen = !isPrivacyModalOpen;
  }

  function handleWindowClick() {
    isPrivacyModalOpen = false;
  }
</script>

<svelte:window onclick={handleWindowClick} />

<header class="topbar">
  <div class="brand">
    <a href="#tool" class="brand-link">
      <Logo width={36} height={24} />
      <div class="brand-name-wrap">
        <span class="brand-title">{tBrand.name}</span>
        <small class="brand-tagline">
          {locale === 'de' ? 'Bilder vektorisieren' : 'Vectorize images'}
          <span>PNG</span><b aria-hidden="true">&gt;</b><span>SVG</span>
        </small>
      </div>
    </a>

    {#if showStatus}
      <p class="status-line" role="status" aria-live="polite" title={statusText}>{statusText}</p>
    {/if}
  </div>

  <div class="topbar-actions">
    <div class="privacy-container">
      <button
        type="button"
        class="privacy-badge"
        class:active={isPrivacyModalOpen}
        onclick={togglePrivacyModal}
        title={tBrand.privacyTooltip}
      >
        <span class="privacy-dot"></span>
        <span class="privacy-text">{tBrand.badge}</span>
        <span class="info-circle">ⓘ</span>
      </button>

      {#if isPrivacyModalOpen}

        <div class="privacy-popover" onclick={(e) => e.stopPropagation()}>
          <div class="popover-head">
            <span class="popover-dot"></span>
            <strong>{locale === 'de' ? '100% Lokale Ausführung' : '100% Local Execution'}</strong>
          </div>
          <p class="popover-desc">
            {locale === 'de'
              ? 'Deine Bilder werden ausschließlich lokal im Browser (WebAssembly & Web Worker) auf deiner eigenen CPU verarbeitet. Keine Uploads, keine Cloud, vollständige Privatsphäre.'
              : 'Your images are processed purely inside your browser (WebAssembly & Web Worker) on your local CPU. Zero uploads, zero telemetry, complete privacy.'}
          </p>
          <div class="popover-tags">
            <span>✓ {locale === 'de' ? 'Kein Server-Upload' : 'No Server Uploads'}</span>
            <span>✓ {locale === 'de' ? 'Funktioniert offline' : 'Works Offline'}</span>
            <span>✓ Open Source</span>
          </div>
        </div>
      {/if}
    </div>

    {#if installPrompt.available}
      <button type="button" class="install-btn" onclick={showInstallPrompt}>
        <span aria-hidden="true">↓</span>
        <span class="install-label">{tPwa.install}</span>
      </button>
    {/if}

    <div class="lang-pill">
      <button
        type="button"
        class:active={locale === 'de'}
        onclick={() => onLocaleChange('de')}
      >
        DE
      </button>
      <button
        type="button"
        class:active={locale === 'en'}
        onclick={() => onLocaleChange('en')}
      >
        EN
      </button>
    </div>

    <a
      href="https://github.com/osodevs/vector-oso"
      target="_blank"
      rel="noopener noreferrer"
      class="gh-button"
      title={tBrand.githubTooltip}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12z"/>
      </svg>
      <span>GitHub</span>
    </a>
  </div>
</header>

<style>
  .status-line {
    display: inline-flex;
    align-items: center;
    margin-left: 12px;
    padding: 3px 9px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 700;
    background: rgba(239, 68, 68, 0.14);
    border: 1px solid rgba(239, 68, 68, 0.45);
    color: #fca5a5;
    max-width: 42vw;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @media (max-width: 640px) {
    .status-line {
      margin-left: 8px;
      padding: 2px 7px;
      font-size: 10px;
      max-width: 38vw;
    }
  }

  .topbar {
    height: 56px;
    background: #0f1118;
    border-bottom: 1px solid #1f2330;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    position: sticky;
    top: 0;
    z-index: 50;
  }

  .brand-link {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    color: var(--text);
  }

  .brand-name-wrap {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .brand-title {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 16px;
    letter-spacing: -0.02em;
    line-height: 1;
    color: #f3f4f6;
  }

  .brand-tagline {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #8b90a0;
    font: 700 9.5px/1 var(--font-mono);
    letter-spacing: 0.03em;
  }

  .brand-tagline span {
    color: var(--accent);
    font-weight: 800;
  }

  .brand-tagline b {
    color: #f3f4f6;
    font-size: 0.9em;
  }

  .topbar-actions {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .privacy-container {
    position: relative;
    display: inline-flex;
  }

  .install-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: 20px;
    border: 1px solid #24293a;
    background: #131520;
    color: #9da1b2;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .install-btn:hover {
    border-color: #3b82f6;
    background: #181d2c;
    color: #f3f4f6;
  }

  @media (max-width: 640px) {
    .install-label {
      display: none;
    }
  }

  .privacy-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #9da1b2;
    font-size: 11px;
    font-weight: 600;
    padding: 5px 12px;
    background: #131520;
    border: 1px solid #24293a;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.15s ease;
    user-select: none;
  }

  .privacy-badge:hover, .privacy-badge.active {
    background: #181d2c;
    border-color: #3b82f6;
    color: #f3f4f6;
    box-shadow: 0 0 12px rgba(59, 130, 246, 0.25);
  }

  .privacy-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #10b981;
    box-shadow: 0 0 8px #10b981;
  }

  .info-circle {
    font-size: 11px;
    color: #64748b;
    pointer-events: none;
  }

  .privacy-popover {
    position: absolute;
    top: calc(100% + 10px);
    right: 0;
    width: 320px;
    padding: 18px 20px;
    background: #131522;
    border: 1px solid #2b334a;
    border-radius: 16px;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
    z-index: 100;
    animation: popoverFade 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes popoverFade {
    from { opacity: 0; transform: translateY(-6px) scale(0.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  .popover-head {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13.5px;
    color: #f8fafc;
    margin-bottom: 8px;
  }

  .popover-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #10b981;
    box-shadow: 0 0 10px #10b981;
  }

  .popover-desc {
    font-size: 12.5px;
    line-height: 1.55;
    color: #94a3b8;
    margin: 0 0 12px 0;
  }

  .popover-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .popover-tags span {
    font-size: 10.5px;
    font-family: var(--font-mono);
    font-weight: 700;
    color: #60a5fa;
    background: rgba(37, 99, 235, 0.15);
    padding: 3px 8px;
    border-radius: 6px;
  }

  .lang-pill {
    display: flex;
    background: #131520;
    padding: 3px;
    border-radius: 20px;
    border: 1px solid #24293a;
  }

  .lang-pill button {
    border: none;
    background: transparent;
    color: #8b90a0;
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .lang-pill button.active {
    background: #2563eb;
    color: #ffffff;
  }

  .lang-pill button:hover:not(.active) {
    color: var(--text);
  }

  .gh-button {
    display: flex;
    align-items: center;
    gap: 7px;
    color: var(--text);
    text-decoration: none;
    font-size: 12px;
    font-weight: 600;
    background: #161824;
    padding: 6px 12px;
    border-radius: 8px;
    border: 1px solid #282d3e;
    transition: all 0.15s ease;
  }

  .gh-button:hover {
    background: #202436;
    border-color: #3f4760;
    transform: translateY(-1px);
  }

  @media (max-width: 900px) {
    .topbar {
      padding: 0 12px;
      height: 48px;
    }

    .brand-title {
      font-size: 14px;
    }

    .brand-tagline {
      display: none;
    }

    .topbar-actions {
      gap: 6px;
    }

    .privacy-text {
      display: none;
    }

    .privacy-badge {
      padding: 5px 8px;
    }

    .gh-button span {
      display: none;
    }

    .gh-button {
      padding: 6px 8px;
    }
  }

  @media (max-width: 480px) {
  }
</style>
