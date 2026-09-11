<script lang="ts">
  import { onMount } from 'svelte';
  import Logo from './Logo.svelte';
  import type { Translations } from '../i18n';
  import LandingHero from './landing/LandingHero.svelte';
  import BezierPlayground from './landing/BezierPlayground.svelte';
  import LandingFeatures from './landing/LandingFeatures.svelte';
  import LandingPricing from './landing/LandingPricing.svelte';
  import LandingFormats from './landing/LandingFormats.svelte';
  import LandingCreator from './landing/LandingCreator.svelte';
  import LandingShare from './landing/LandingShare.svelte';

  import { hasLegal } from '../legal';
  import type { Locale } from '../i18n';

  interface Props {
    t: Translations['landing'];
    tLegal: Translations['legal'];
    locale: Locale;
    onNavigate: (to: string) => void;
  }

  let { t, tLegal, locale, onNavigate }: Props = $props();

  let legalHref = $derived(locale === 'de' ? '/de/impressum' : '/impressum');

  function openLegal(e: MouseEvent) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    onNavigate(legalHref);
  }

  let showBackToTool = $state(false);

  function handleScroll() {
    if (typeof window !== 'undefined') {
      showBackToTool = window.scrollY > 400;
    }
  }

  function scrollToTool(e: MouseEvent) {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  onMount(() => {
    const revealElements = document.querySelectorAll<HTMLElement>('[data-reveal]');
    if (typeof IntersectionObserver !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      revealElements.forEach(el => el.classList.add('reveal-pending'));
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });
      revealElements.forEach(el => observer.observe(el));
      return () => observer.disconnect();
    } else {
      revealElements.forEach(el => el.classList.add('is-visible'));
    }
  });
</script>

<svelte:window onscroll={handleScroll} />

<section class="landing-story seo-story">
  <button
    type="button"
    class="back-to-tool"
    class:visible={showBackToTool}
    onclick={scrollToTool}
    title={t.heroCta}
  >
    <span>↑</span> {t.heroCta}
  </button>

  <LandingHero {t} />
  <BezierPlayground {t} />
  <LandingFeatures {t} />
  <LandingPricing {t} />
  <LandingFormats {t} />
  <LandingCreator {t} />
  <LandingShare {t} {locale} />

  <footer class="story-footer" data-reveal>
    <div class="footer-brand">
      <Logo width={38} height={24} />
      <div>
        <strong>Vector Oso</strong>
        <small>PNG & JPG > SVG</small>
      </div>
    </div>
    <p>{t.footerText}</p>
    {#if hasLegal}
      <a class="footer-legal" href={legalHref} onclick={openLegal}>{tLegal.link}</a>
    {/if}
  </footer>
</section>

<style>
  .landing-story {
    --story-bg: #08090d;
    --story-surface: #0f1118;
    --story-text: #f8fafc;
    --story-muted: #94a3b8;
    --story-line: #1e2232;
    --story-accent: #60a5fa;
    position: relative;
    isolation: isolate;
    overflow: clip;
    background: var(--story-bg);
    color: var(--story-text);
    width: 100%;
    margin: 0 auto;
    padding-bottom: 100px;
  }

  .landing-story:before {
    content: "";
    position: absolute;
    z-index: -1;
    top: 0;
    left: 8vw;
    width: 1px;
    height: 100%;
    background: rgba(255, 255, 255, 0.035);
    box-shadow: 21vw 0 rgba(255, 255, 255, 0.025),
      42vw 0 rgba(255, 255, 255, 0.025),
      63vw 0 rgba(255, 255, 255, 0.025),
      84vw 0 rgba(255, 255, 255, 0.025);
    pointer-events: none;
  }

  :global(.seo-boundary) {
    width: min(1360px, calc(100% - clamp(32px, 6vw, 120px)));
    margin-inline: auto;
  }

  :global([data-reveal]) {
    opacity: 1;
    transform: translateY(0);
    transition: opacity 0.8s ease, transform 0.8s cubic-bezier(0.2, 0.78, 0.18, 1);
  }

  :global([data-reveal].reveal-pending) {
    opacity: 0;
    transform: translateY(34px);
  }

  :global([data-reveal].reveal-pending.is-visible) {
    opacity: 1;
    transform: translateY(0);
  }

  .landing-story > :global(*) {
    content-visibility: auto;
    contain-intrinsic-size: auto 600px;
  }

  .landing-story > .back-to-tool {
    content-visibility: visible;
  }

  .back-to-tool {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 90;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 11px 22px;
    background: #2563eb;
    color: #ffffff;
    border-radius: 9999px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 10px 28px rgba(37, 99, 235, 0.45);
    opacity: 0;
    transform: translateY(20px) scale(0.85);
    pointer-events: none;
    transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1),
      transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
      background 0.15s ease;
  }

  .back-to-tool.visible {
    opacity: 1;
    transform: translateY(0) scale(1);
    pointer-events: auto;
  }

  .back-to-tool:hover {
    transform: translateY(-2px) scale(1.04);
    background: #1d4ed8;
  }

  .story-footer {
    width: min(1360px, calc(100% - clamp(32px, 6vw, 120px)));
    margin-inline: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 56px;
    border-top: 1px solid var(--story-line);
    color: var(--story-muted);
  }

  .footer-legal {
    color: var(--story-muted);
    font-size: 13px;
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: color 0.15s ease, border-color 0.15s ease;
  }

  .footer-legal:hover {
    color: var(--story-text);
    border-bottom-color: var(--story-line);
  }

  .footer-brand {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .footer-brand strong {
    font-family: var(--font-display, var(--font-sans));
    font-size: 15px;
    font-weight: 800;
    color: var(--story-text);
    display: block;
    line-height: 1;
  }

  .footer-brand small {
    font: 700 9px/1 var(--font-mono, ui-monospace, monospace);
    color: var(--story-accent);
    letter-spacing: 0.05em;
  }

  .story-footer p {
    font-size: 13px;
    color: #64748b;
    margin: 0;
  }

  @media (max-width: 640px) {
    .story-footer {
      flex-direction: column;
      gap: 16px;
      align-items: flex-start;
      padding-top: 36px;
    }

    .back-to-tool {
      bottom: 16px;
      right: 16px;
      padding: 9px 16px;
      font-size: 12px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    :global([data-reveal]) {
      transition: none !important;
      opacity: 1 !important;
      transform: none !important;
    }
  }
</style>
