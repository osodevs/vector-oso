<script lang="ts">
  import type { Translations } from '../../i18n';

  interface Props {
    t: Translations['landing'];
    locale: string;
  }

  let { t, locale }: Props = $props();

  let copied = $state(false);
  let host = $state('');
  let animate = $state(false);
  let visual = $state<HTMLElement | null>(null);
  let timer: ReturnType<typeof setTimeout> | undefined;

  $effect(() => {
    host = window.location.host;
    return () => clearTimeout(timer);
  });

  $effect(() => {
    if (!visual) return;
    if (!('IntersectionObserver' in window)) {
      animate = true;
      return;
    }
    const io = new IntersectionObserver(([entry]) => (animate = entry.isIntersecting), {
      rootMargin: '150px'
    });
    io.observe(visual);
    return () => io.disconnect();
  });

  async function copyLink() {
    const url = window.location.origin + (locale === 'de' ? '/de' : '/');
    try {
      await navigator.clipboard.writeText(url);
      copied = true;
      clearTimeout(timer);
      timer = setTimeout(() => (copied = false), 2200);
    } catch {
      copied = false;
    }
  }
</script>

<section class="seo-share" aria-labelledby="shareTitle">
  <div class="share-inner seo-boundary">
    <div class="share-copy" data-reveal>
      <span class="seo-kicker">{t.shareKicker}</span>
      <h2 id="shareTitle">
        {t.shareTitleP1}<br />
        <i>{t.shareTitleP2}</i>
      </h2>
      <p>{t.shareDesc}</p>

      <ul>
        <li>{t.shareB1}</li>
        <li>{t.shareB2}</li>
        <li>{t.shareB3}</li>
      </ul>

      <button class="seo-cta" type="button" onclick={copyLink}>
        <span>{copied ? t.shareCopied : t.shareCta}</span>
        <span class="cta-arrow">{copied ? '✓' : '↗'}</span>
      </button>
    </div>

    <div
      class="share-visual"
      class:animate
      bind:this={visual}
      aria-hidden="true"
      data-reveal
    >
      <svg viewBox="0 0 640 340">
        <path
          class="share-track"
          d="M135 172C260 172 260 90 360 171C460 252 486 171 586 171"
        />
        <circle class="share-waypoint" cx="360" cy="171" r="6" />

        <g class="share-node">
          <circle class="share-node-disc" cx="135" cy="172" r="39" />
          <text class="share-node-label" x="135" y="172">{t.shareYou}</text>
        </g>

        <g class="share-node">
          <circle class="share-node-disc" cx="586" cy="171" r="39" />
          <text class="share-node-label" x="586" y="171">{t.shareFriend}</text>
        </g>
      </svg>

      <div class="share-link-chip">{host || 'vector-oso'}</div>
      <div class="share-burst">
        <small>{t.shareBurstTop}</small>
        <strong>+1</strong>
        <span>{t.shareBurstBottom}</span>
      </div>
    </div>
  </div>
</section>

<style>
  .seo-share {
    width: 100%;
    min-height: 90svh;
    display: grid;
    align-content: center;
    padding-block: clamp(110px, 14vw, 200px);
    border-bottom: 1px solid color-mix(in srgb, #0b0c11 24%, transparent);
    background: var(--story-accent, #60a5fa);
    color: #0b0c11;
  }

  .share-inner {
    display: grid;
    grid-template-columns: minmax(340px, 0.9fr) minmax(0, 1.1fr);
    gap: clamp(60px, 10vw, 150px);
    align-items: center;
  }

  .seo-share .seo-kicker {
    color: #0b0c11;
    opacity: 0.62;
  }

  .share-copy h2 {
    margin: 24px 0 30px;
    font-size: clamp(58px, 7vw, 112px);
    font-weight: 600;
    line-height: 0.84;
    letter-spacing: -0.07em;
    color: #0b0c11;
  }

  .share-copy h2 i {
    font-style: italic;
    color: #0b0c11;
  }

  .share-copy > p {
    max-width: 620px;
    margin: 0;
    color: color-mix(in srgb, #0b0c11 80%, transparent);
    font-size: clamp(15px, 1.25vw, 18px);
    line-height: 1.68;
  }

  .share-copy ul {
    margin: 32px 0 36px;
    padding: 0;
    display: grid;
    gap: 13px;
    list-style: none;
  }

  .share-copy li {
    position: relative;
    padding-left: 20px;
    color: color-mix(in srgb, #0b0c11 74%, transparent);
    font-size: 15px;
    line-height: 1.55;
  }

  .share-copy li:before {
    content: '+';
    position: absolute;
    left: 0;
    color: #0b0c11;
    font-weight: 800;
  }

  .seo-share .seo-cta {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 15px 26px;
    border: 0;
    border-radius: 9999px;
    background: #0b0c11;
    color: #ffffff;
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
    transition: background 0.16s ease, color 0.16s ease, transform 0.16s ease;
  }

  .seo-share .seo-cta:hover {
    background: #ffffff;
    color: #0b0c11;
    transform: translateY(-2px);
  }

  .share-visual {
    min-height: 520px;
    position: relative;
    overflow: hidden;
    border: 1px solid rgba(11, 12, 17, 0.22);
    border-radius: 16px;
    background:
      radial-gradient(circle at 70% 42%, rgba(255, 255, 255, 0.28), transparent 34%),
      color-mix(in srgb, var(--story-accent, #60a5fa) 86%, white);
  }

  .share-visual svg {
    width: 100%;
    height: 100%;
    position: absolute;
    inset: 0;
    overflow: visible;
  }

  .share-track {
    fill: none;
    stroke: rgba(11, 12, 17, 0.68);
    stroke-width: 3;
    stroke-linecap: round;
    stroke-dasharray: 12 11;
  }

  .share-visual.animate .share-track {
    animation: share-flow 2.2s linear infinite;
  }

  .share-waypoint {
    fill: var(--story-accent, #60a5fa);
    stroke: #0b0c11;
    stroke-width: 3;
  }

  .share-node-disc {
    fill: #0b0c11;
    stroke: rgba(11, 12, 17, 0.52);
    stroke-width: 1;
  }

  .share-node-label {
    fill: #ffffff;
    font-family: var(--font-mono, ui-monospace, monospace);
    font-size: 11px;
    font-weight: 760;
    letter-spacing: 0.1em;
    text-anchor: middle;
    dominant-baseline: middle;
  }

  .share-link-chip {
    position: absolute;
    z-index: 3;
    left: 30%;
    top: 22%;
    padding: 12px 15px;
    border: 1px solid rgba(11, 12, 17, 0.26);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.82);
    color: #0b0c11;
    font: 700 10px/1 var(--font-mono, ui-monospace, monospace);
    transform: rotate(-3deg);
  }

  .share-visual.animate .share-link-chip {
    animation: share-chip 3.6s ease-in-out infinite;
  }

  .share-burst {
    position: absolute;
    z-index: 3;
    right: 25%;
    bottom: 13%;
    display: grid;
    justify-items: center;
    gap: 7px;
    transform: rotate(4deg);
  }

  .share-burst small,
  .share-burst span {
    color: rgba(11, 12, 17, 0.66);
    font: 760 9px/1 var(--font-mono, ui-monospace, monospace);
    letter-spacing: 0.16em;
  }

  .share-burst strong {
    color: #0b0c11;
    font: 600 clamp(80px, 10vw, 142px)/0.9 var(--font-sans, Inter, sans-serif);
    letter-spacing: -0.07em;
    text-shadow: 0 0 45px rgba(255, 255, 255, 0.35);
  }

  @keyframes share-flow {
    to {
      stroke-dashoffset: -46;
    }
  }

  @keyframes share-chip {
    0%,
    100% {
      transform: translateY(0) rotate(-3deg);
    }
    50% {
      transform: translateY(-8px) rotate(-1deg);
    }
  }

  @keyframes share-chip-mobile {
    0%,
    100% {
      transform: translate(-50%) translateY(0) rotate(-3deg);
    }
    50% {
      transform: translate(-50%) translateY(-8px) rotate(-1deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .share-visual.animate .share-track,
    .share-visual.animate .share-link-chip {
      animation: none;
    }
  }

  @media (max-width: 900px) {
    .seo-share {
      min-height: auto;
      padding-block: 100px;
    }

    .share-inner {
      grid-template-columns: 1fr;
      gap: 54px;
    }

    .share-visual {
      min-height: 400px;
    }

    .share-link-chip {
      left: 50%;
      top: 18%;
      transform: translate(-50%) rotate(-3deg);
      white-space: nowrap;
    }

    .share-visual.animate .share-link-chip {
      animation-name: share-chip-mobile;
    }

    .share-burst {
      right: 50%;
      bottom: 8%;
      transform: translate(50%) rotate(4deg);
    }

    .share-burst strong {
      font-size: clamp(72px, 22vw, 108px);
    }
  }
</style>
