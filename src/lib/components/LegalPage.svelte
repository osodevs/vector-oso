<script lang="ts">
  import type { Translations, Locale } from '../i18n';
  import { operator } from '../legal';

  import { fade } from 'svelte/transition';

  interface Props {
    t: Translations['legal'];
    locale: Locale;
    onClose: () => void;
  }

  let { t, locale, onClose }: Props = $props();

  let homeHref = $derived(locale === 'de' ? '/de' : '/');

  function close(e: MouseEvent) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    onClose();
  }
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && onClose()} />

<main class="legal" in:fade={{ duration: 160 }}>
  <a class="back" href={homeHref} onclick={close}>← {t.backToTool}</a>

  {#if operator}
    <section>
      <h1>{t.impressumTitle}</h1>
      <h2>{t.responsible}</h2>
      <address>
        {operator.name}<br />
        {#each operator.address as line}
          {line}<br />
        {/each}
      </address>
      {#if operator.email}
        <h2>{t.contact}</h2>
        <p><a href="mailto:{operator.email}">{operator.email}</a></p>
      {/if}
    </section>
  {/if}

  <section>
    <h2>{t.privacyTitle}</h2>
    {#each t.privacyBody as paragraph}
      <p>{paragraph}</p>
    {/each}
  </section>

  <section>
    <h2>{t.priceTitle}</h2>
    <p>{t.priceBody}</p>
  </section>

  <section>
    <h2>{t.licenseTitle}</h2>
    <p>{t.licenseBody}</p>
  </section>
</main>

<style>
  .legal {
    --legal-bg: #08090d;
    --legal-text: #f8fafc;
    --legal-muted: #94a3b8;
    --legal-line: #1e2232;
    --legal-accent: #60a5fa;
    position: fixed;
    inset: 0;
    z-index: 300;
    overflow-y: auto;
    overscroll-behavior: contain;
    box-sizing: border-box;
    padding: clamp(48px, 8vw, 110px) clamp(20px, 6vw, 40px) 120px;
    background: var(--legal-bg);
    color: var(--legal-text);
    font: 400 16px/1.65 var(--font-sans, Inter, system-ui, sans-serif);
  }

  .legal > :global(*) {
    width: min(720px, 100%);
    margin-inline: auto;
  }

  .back {
    display: block;
    margin-bottom: clamp(36px, 6vw, 64px);
    color: var(--legal-muted);
    font-size: 14px;
    text-decoration: none;
  }

  .back:hover {
    color: var(--legal-accent);
  }

  section + section {
    margin-top: 52px;
    padding-top: 44px;
    border-top: 1px solid var(--legal-line);
  }

  h1 {
    margin: 0 0 32px;
    font-size: clamp(30px, 5vw, 42px);
    font-weight: 600;
    letter-spacing: -0.03em;
  }

  h2 {
    margin: 0 0 14px;
    font-size: 13px;
    font-weight: 750;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--legal-muted);
  }

  section + section h2 {
    font-size: clamp(19px, 2.4vw, 23px);
    font-weight: 600;
    letter-spacing: -0.01em;
    text-transform: none;
    color: var(--legal-text);
    margin-bottom: 18px;
  }

  address {
    font-style: normal;
    margin-bottom: 34px;
  }

  p {
    margin: 0 0 16px;
    color: #cbd5e1;
  }

  a {
    color: var(--legal-accent);
  }
</style>
