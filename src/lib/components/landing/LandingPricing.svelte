<script lang="ts">
  import type { Translations } from '../../i18n';

  interface Props {
    t: Translations['landing'];
  }

  let { t }: Props = $props();

  const payHref = import.meta.env.VITE_KOFI_URL || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
</script>

<section class="seo-price seo-boundary" aria-labelledby="priceTitle">
  <div class="price-number" data-reveal>
    <small>{t.priceNoContract}</small>
    <strong><s>10€</s></strong>
    <span>
      {t.priceSimple}<br />
      {t.priceEquation}<br />
      <small>{t.mathBadge}</small>
    </span>
  </div>

  <div class="price-copy" data-reveal>
    <span class="seo-kicker">{t.priceKicker}</span>
    <h2 id="priceTitle">
      {t.priceTitleP1}<br />
      <i>{t.priceTitleP2}</i>
      <small class="story-tax-note">{t.mathBadge}</small>
    </h2>
    <p>{t.priceDesc}</p>

    <div class="price-equation-large">
      <strong>{t.priceEquation}</strong>
      <span>{t.priceEquationSub}</span>
    </div>

    <ul>
      <li>{t.priceB1}</li>
      <li>{t.priceB2}</li>
      <li>{t.priceB3}</li>
      <li>{t.priceB4}</li>
    </ul>

    <a
      class="pay-anyway-btn seo-cta"
      href={payHref}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span>{t.payAnywayBtn}</span>
      <span class="cta-arrow">↗</span>
    </a>
  </div>
</section>

<style>
  .seo-price {
    min-height: 90svh;
    display: grid;
    grid-template-columns: minmax(340px, 0.8fr) minmax(0, 1.2fr);
    gap: clamp(70px, 12vw, 190px);
    align-items: center;
    padding-block: clamp(120px, 15vw, 220px);
    border-bottom: 1px solid var(--story-line, #1e2232);
  }

  .price-number {
    width: min(100%, 580px);
    position: relative;
    display: grid;
    justify-items: start;
    gap: 13px;
    padding: clamp(34px, 5vw, 62px);
    border: 1px solid var(--story-line, #1e2232);
    background: #0f1117;
  }

  .price-number > small {
    color: var(--story-muted, #94a3b8);
    font: 720 9px/1 var(--font-mono, ui-monospace, monospace);
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  .price-number strong {
    color: var(--story-text, #f8fafc);
    font: 560 clamp(76px, 9vw, 142px)/0.9 var(--font-sans, Inter, sans-serif);
    letter-spacing: -0.09em;
  }

  .price-number strong s {
    text-decoration-line: line-through;
    text-decoration-color: var(--story-accent, #3b82f6);
    text-decoration-thickness: clamp(3px, 0.45vw, 7px);
    text-decoration-skip-ink: none;
  }

  .price-number > span {
    justify-self: start;
    margin-top: 24px;
    color: var(--story-text, #f8fafc);
    font: 670 clamp(16px, 1.8vw, 25px)/1.18 var(--font-sans, Inter, sans-serif);
    letter-spacing: -0.035em;
  }

  .price-number > span small {
    display: block;
    margin-top: 9px;
    color: var(--story-muted, #94a3b8);
    font: 650 9px/1 var(--font-mono, ui-monospace, monospace);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .seo-kicker {
    display: inline-block;
    color: var(--story-accent, #60a5fa);
    font: 760 10.5px/1.3 var(--font-mono, ui-monospace, monospace);
    letter-spacing: 0.14em;
    text-transform: uppercase;
    margin-bottom: 14px;
  }

  .price-copy h2 {
    margin: 24px 0 30px;
    color: var(--story-text, #f8fafc);
    font-size: clamp(66px, 7.6vw, 116px);
    font-weight: 650;
    line-height: 0.84;
    letter-spacing: -0.065em;
  }

  .price-copy h2 i {
    color: var(--story-accent, #60a5fa);
    font-family: Georgia, 'Times New Roman', serif;
    font-style: italic;
    font-weight: 400;
  }

  .story-tax-note {
    display: block;
    margin-top: 13px;
    color: var(--story-muted, #94a3b8);
    font: 650 10px/1 var(--font-mono, ui-monospace, monospace);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .price-copy > p {
    max-width: 610px;
    margin: 0;
    font-size: 17px;
    line-height: 1.65;
    color: var(--story-muted, #94a3b8);
  }

  .price-equation-large {
    margin: 42px 0 34px;
    display: grid;
    gap: 8px;
    color: var(--story-text, #f8fafc);
  }

  .price-equation-large strong {
    color: var(--story-text, #f8fafc);
    font-size: clamp(22px, 2.5vw, 38px);
    font-weight: 800;
    letter-spacing: -0.045em;
  }

  .price-equation-large span {
    color: var(--story-accent, #60a5fa);
    font: 500 clamp(22px, 2.2vw, 34px)/1.1 Georgia, serif;
    font-style: italic;
  }

  .price-copy ul {
    margin: 0 0 38px;
    padding: 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px 30px;
    list-style: none;
  }

  .price-copy li {
    position: relative;
    padding-left: 18px;
    color: var(--story-muted, #cbd5e1);
    font-size: 13.5px;
    line-height: 1.55;
  }

  .price-copy li:before {
    content: "•";
    position: absolute;
    left: 0;
    color: var(--story-accent, #60a5fa);
    font-weight: 800;
  }

  .pay-anyway-btn {
    min-width: 240px;
    height: 52px;
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    padding: 0 22px;
    border-radius: 13px;
    background: #2563eb;
    color: #ffffff;
    font-size: 12.5px;
    font-weight: 800;
    text-decoration: none;
    cursor: pointer;
    box-shadow: 0 8px 24px rgba(37, 99, 235, 0.4);
    transition: transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
  }

  .pay-anyway-btn:hover {
    transform: translateY(-2px);
    background: #1d4ed8;
    box-shadow: 0 12px 30px rgba(37, 99, 235, 0.55);
  }

  .cta-arrow {
    font-size: 15px;
    color: #93c5fd;
    transition: transform 0.18s ease;
  }

  .pay-anyway-btn:hover .cta-arrow {
    transform: translate(2px, -2px);
  }

  @media (max-width: 900px) {
    .seo-price {
      min-height: auto;
      grid-template-columns: 1fr;
      gap: 60px;
    }

    .price-number {
      justify-self: center;
    }

    .price-number strong {
      font-size: clamp(130px, 30vw, 220px);
    }
  }

  @media (max-width: 560px) {
    .seo-price {
      padding-block: 104px;
    }

    .price-number {
      justify-self: stretch;
      width: 100%;
      padding: clamp(28px, 6vw, 42px);
    }

    .price-number strong {
      font-size: clamp(78px, 23vw, 112px);
    }

    .price-copy ul {
      grid-template-columns: 1fr;
    }

    .price-equation-large {
      font-size: 15px;
      gap: 9px;
    }
  }
</style>
