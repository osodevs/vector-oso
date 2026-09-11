<script lang="ts">
  import type { Translations } from '../../i18n';

  interface Props {
    t: Translations['landing'];
  }

  let { t }: Props = $props();
</script>

<section class="seo-explainer seo-boundary">
  <div class="seo-section-heading" data-reveal>
    <span class="seo-kicker">{t.f2Kicker}</span>
    <h2>{t.f2Title}</h2>
  </div>

  <div class="explainer-copy" data-reveal>
    <dl>
      <div>
        <dt>SVG</dt>
        <dd>{t.svgDesc}</dd>
      </div>
      <div>
        <dt>PDF</dt>
        <dd>{t.pdfDesc}</dd>
      </div>
      <div>
        <dt>DXF</dt>
        <dd>{t.dxfDesc}</dd>
      </div>
      <div>
        <dt>EPS</dt>
        <dd>{t.epsDesc}</dd>
      </div>
      <div>
        <dt>PNG</dt>
        <dd>{t.pngDesc}</dd>
      </div>
    </dl>
  </div>
</section>

<style>
  .seo-explainer {
    min-height: 80svh;
    display: grid;
    grid-template-columns: minmax(340px, 0.85fr) minmax(0, 1.15fr);
    gap: clamp(60px, 10vw, 160px);
    align-items: center;
    padding-block: clamp(100px, 12vw, 180px);
    border-bottom: 1px solid var(--story-line, #242735);
  }

  .seo-section-heading {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .seo-kicker {
    display: inline-block;
    color: var(--story-accent, #60a5fa);
    font: 760 10.5px/1.3 var(--font-mono, ui-monospace, monospace);
    letter-spacing: 0.14em;
    text-transform: uppercase;
    margin-bottom: 14px;
  }

  .seo-section-heading h2 {
    font-size: clamp(48px, 5.5vw, 84px);
    font-weight: 650;
    line-height: 0.9;
    letter-spacing: -0.06em;
    color: var(--story-text, #f8fafc);
  }

  .explainer-copy dl {
    margin: 0;
    display: grid;
  }

  .explainer-copy dl > div {
    display: grid;
    grid-template-columns: 72px 1fr;
    gap: 24px;
    padding: 22px 0;
    border-top: 1px solid var(--story-line, #242735);
  }

  .explainer-copy dl > div:last-child {
    border-bottom: 1px solid var(--story-line, #242735);
  }

  .explainer-copy dt {
    color: var(--story-accent, #60a5fa);
    font: 800 14px/1.4 var(--font-mono, ui-monospace, monospace);
    letter-spacing: 0.05em;
  }

  .explainer-copy dd {
    margin: 0;
    color: var(--story-muted, #cbd5e1);
    font-size: 14px;
    line-height: 1.6;
  }

  @media (max-width: 900px) {
    .seo-explainer {
      min-height: auto;
      grid-template-columns: 1fr;
      gap: 36px;
      padding-block: 72px;
    }

    .seo-section-heading h2 {
      font-size: clamp(38px, 10vw, 60px);
    }
  }
</style>
