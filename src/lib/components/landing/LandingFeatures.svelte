<script lang="ts">
  import type { Translations } from '../../i18n';

  interface Props {
    t: Translations['landing'];
  }

  let { t }: Props = $props();
</script>

<section class="seo-workflow seo-boundary">
  <div class="seo-section-heading" data-reveal>
    <div class="heading-left">
      <span class="seo-kicker">{t.f1Kicker}</span>
      <h2>{t.f1Title}</h2>
    </div>
    <p>{t.f1Desc}</p>
  </div>

  <ol class="workflow-copy" data-reveal>
    <li>
      <small>01</small>
      <div>
        <strong>{t.c1Title}</strong>
        <p>{t.c1Desc}</p>
      </div>
    </li>
    <li>
      <small>02</small>
      <div>
        <strong>{t.c2Title}</strong>
        <p>{t.c2Desc}</p>
      </div>
    </li>
    <li>
      <small>03</small>
      <div>
        <strong>{t.c3Title}</strong>
        <p>{t.c3Desc}</p>
      </div>
    </li>
    <li>
      <small>04</small>
      <div>
        <strong>{t.c4Title}</strong>
        <p>{t.c4Desc}</p>
      </div>
    </li>
  </ol>
</section>

<style>
  .seo-workflow {
    min-height: 90svh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding-block: clamp(100px, 12vw, 180px);
    border-bottom: 1px solid var(--story-line, #242735);
  }

  .seo-section-heading {
    display: grid;
    grid-template-columns: minmax(0, 1.3fr) minmax(280px, 0.7fr);
    gap: 36px;
    align-items: end;
    margin-bottom: 48px;
  }

  .seo-kicker {
    display: inline-block;
    color: var(--story-accent, #60a5fa);
    font: 760 10.5px/1.3 var(--font-mono, ui-monospace, monospace);
    letter-spacing: 0.14em;
    text-transform: uppercase;
    margin-bottom: 12px;
  }

  .seo-section-heading h2 {
    font-size: clamp(48px, 5.5vw, 84px);
    font-weight: 650;
    line-height: 0.9;
    letter-spacing: -0.06em;
    color: var(--story-text, #f8fafc);
  }

  .seo-section-heading > p {
    max-width: 480px;
    margin: 0 0 6px;
    font-size: 16px;
    line-height: 1.65;
    color: var(--story-muted, #94a3b8);
  }

  .workflow-copy {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0 48px;
  }

  .workflow-copy li {
    display: grid;
    grid-template-columns: 36px 1fr;
    gap: 16px;
    padding: 28px 0;
    border-top: 1px solid var(--story-line, #242735);
  }

  .workflow-copy small {
    padding-top: 2px;
    color: var(--story-accent, #60a5fa);
    font: 750 11px/1 var(--font-mono, ui-monospace, monospace);
    letter-spacing: 0.08em;
  }

  .workflow-copy strong {
    display: block;
    color: var(--story-text, #f8fafc);
    font-size: clamp(17px, 1.4vw, 21px);
    font-weight: 750;
    letter-spacing: -0.02em;
    margin-bottom: 8px;
  }

  .workflow-copy p {
    margin: 0;
    font-size: 13.5px;
    line-height: 1.65;
    color: var(--story-muted, #94a3b8);
  }

  @media (max-width: 900px) {
    .seo-workflow {
      min-height: auto;
      padding-block: 72px;
    }

    .seo-section-heading {
      grid-template-columns: 1fr;
      gap: 20px;
      margin-bottom: 32px;
    }

    .seo-section-heading h2 {
      font-size: clamp(40px, 11vw, 64px);
    }

    .workflow-copy {
      grid-template-columns: 1fr;
    }

    .workflow-copy li {
      padding: 22px 0;
    }
  }
</style>
