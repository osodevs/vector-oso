<script lang="ts">
  import type { Translations } from '../../i18n';

  interface Props {
    t: Translations['landing'];
  }

  let { t }: Props = $props();
</script>

<section class="fynn-case seo-boundary" aria-labelledby="creatorTitle">
  <div class="creator-visual" data-reveal>
    <figure class="creator-emblem-card">
      <svg viewBox="0 0 100 100" class="creator-bear-emblem" aria-hidden="true">
        <circle cx="50" cy="50" r="46" fill="rgba(37, 99, 235, 0.12)" stroke="#3b82f6" stroke-width="2"/>
        <path d="M30 35 C24 35 20 40 22 47 C24 53 28 55 33 53 C36 68 64 68 67 53 C72 55 76 53 78 47 C80 40 76 35 70 35 C64 35 60 40 59 45 C55 43 45 43 41 45 C40 40 36 35 30 35 Z" fill="#3b82f6"/>
        <ellipse cx="50" cy="60" rx="11" ry="8" fill="#1e293b"/>
        <ellipse cx="50" cy="57" rx="5" ry="3.5" fill="#60a5fa"/>
        <circle cx="41" cy="50" r="2.5" fill="#ffffff"/>
        <circle cx="59" cy="50" r="2.5" fill="#ffffff"/>
      </svg>
      <figcaption>{t.osoRole}</figcaption>
    </figure>
  </div>

  <div class="creator-copy" data-reveal>
    <span class="seo-kicker">{t.osoKicker}</span>
    <h2 id="creatorTitle">
      {t.osoTitleP1}<br />
      <i>{t.osoTitleP2}</i>
    </h2>

    <p>{t.osoText1}</p>
    <p>{t.osoText2}</p>

    <blockquote>{t.osoQuote}</blockquote>

    <div class="case-tags">
      <span>{t.openSourceBadge}</span>
      <span>EMBROIDERY</span>
      <span>SCREEN PRINT</span>
      <span>PLOTTER</span>
      <span>LASER & CNC</span>
    </div>
  </div>
</section>

<style>
  .fynn-case {
    min-height: 90svh;
    display: grid;
    grid-template-columns: minmax(320px, 0.8fr) minmax(0, 1.2fr);
    gap: clamp(60px, 10vw, 160px);
    align-items: center;
    padding-block: clamp(100px, 12vw, 180px);
    border-bottom: 1px solid var(--story-line, #242735);
  }

  .creator-visual {
    display: flex;
    justify-content: center;
    width: 100%;
  }

  .creator-emblem-card {
    width: 100%;
    max-width: 440px;
    margin: 0;
    padding: clamp(34px, 5vw, 62px);
    border: 1px solid var(--story-line, #242735);
    border-radius: 16px;
    background: #0f1117;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 20px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
  }

  .creator-bear-emblem {
    width: 110px;
    height: 110px;
    filter: drop-shadow(0 10px 24px rgba(59, 130, 246, 0.35));
  }

  .creator-emblem-card figcaption {
    font: 700 9.5px/1 var(--font-mono, ui-monospace, monospace);
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--story-muted, #94a3b8);
  }

  .creator-copy {
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

  .creator-copy h2 {
    margin: 0 0 24px;
    color: var(--story-text, #f8fafc);
    font-size: clamp(52px, 6.2vw, 92px);
    font-weight: 650;
    line-height: 0.88;
    letter-spacing: -0.065em;
  }

  .creator-copy h2 i {
    color: var(--story-accent, #60a5fa);
    font-family: Georgia, 'Times New Roman', serif;
    font-style: italic;
    font-weight: 400;
  }

  .creator-copy > p {
    max-width: 640px;
    margin: 0 0 16px;
    font-size: 16px;
    line-height: 1.7;
    color: var(--story-muted, #94a3b8);
  }

  .creator-copy blockquote {
    max-width: 640px;
    margin: 32px 0 34px;
    padding: 0;
    color: var(--story-text, #f8fafc);
    font: 400 clamp(24px, 2.8vw, 42px)/1.15 Georgia, serif;
    font-style: italic;
    letter-spacing: -0.03em;
  }

  .case-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .case-tags span {
    padding: 7px 11px;
    border: 1px solid var(--story-line, #242735);
    border-radius: 6px;
    color: #94a3b8;
    font: 700 9px/1 var(--font-mono, ui-monospace, monospace);
    letter-spacing: 0.1em;
  }

  @media (max-width: 900px) {
    .fynn-case {
      min-height: auto;
      grid-template-columns: 1fr;
      gap: 40px;
      padding-block: 72px;
    }

    .creator-copy h2 {
      font-size: clamp(40px, 11vw, 64px);
    }
  }
</style>
