<script lang="ts">
  import { onMount } from 'svelte';
  import type { Translations } from '../../i18n';

  interface Props {
    t: Translations['landing'];
  }

  let { t }: Props = $props();

  let isHeroVisible = $state(false);
  let isWordActive = $state(false);
  let heroEl: HTMLElement | undefined = $state();

  onMount(() => {
    if (typeof IntersectionObserver === 'undefined') {
      isHeroVisible = true;
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        isHeroVisible = entries[0].isIntersecting;
      },
      { threshold: 0.15 }
    );
    if (heroEl) observer.observe(heroEl);
    return () => observer.disconnect();
  });
</script>

<header
  bind:this={heroEl}
  class="seo-hero seo-boundary"
  class:visible={isHeroVisible}
  data-reveal
>
  <div class="seo-hero-copy">
    <span class="seo-kicker">{t.kicker}</span>

    <h1 id="seoHeadline">
      {t.heroTitleP1}<br />

      <span
        class="pixel-smooth-word"
        class:active={isWordActive}
        onclick={() => (isWordActive = !isWordActive)}
        aria-label="Interactive vector path demo"
      >
        <span class="pixel-label" aria-hidden="true">
          {#each t.heroTitleP2.split('') as letter, i}
            <b style:--fragment={i}>{letter}</b>
          {/each}
        </span>

        <i class="vector-label">{t.heroTitleP2.toLowerCase()}</i>

        <svg class="word-vector-ui" viewBox="0 0 330 96" aria-hidden="true">
          <path d="M9 70C56 42 88 81 125 55S197 36 235 58 289 69 320 30"/>
          <g class="word-nodes-group">
            <circle cx="9" cy="70" r="4"/>
            <circle cx="125" cy="55" r="4"/>
            <circle cx="235" cy="58" r="4"/>
            <circle cx="320" cy="30" r="4"/>
          </g>
        </svg>
      </span>
    </h1>

    <p>{t.heroDesc}</p>
    <small class="hover-instruction">{t.hoverHint}</small>
  </div>

  <div class="trace-orbit" aria-hidden="true" data-reveal>
    <svg viewBox="0 0 620 440" role="presentation">
      <g class="trace-grid">
        <path d="M30 88H590M30 176H590M30 264H590M30 352H590M118 28V412M206 28V412M294 28V412M382 28V412M470 28V412"/>
      </g>
      <path class="trace-raster" d="M54 312h34v-34h34v-68h34v34h34v34h34v-102h34v34h34v34h34v-68h34v34h34v34h34v-34h34"/>
      <path class="trace-vector" d="M54 312C95 312 102 213 150 213s49 67 94 67 32-106 78-106 57 74 101 74 65-20 113-20"/>
      <g class="trace-nodes">
        <circle cx="54" cy="312" r="7"/>
        <circle cx="150" cy="213" r="7"/>
        <circle cx="244" cy="280" r="7"/>
        <circle cx="322" cy="174" r="7"/>
        <circle cx="423" cy="248" r="7"/>
        <circle cx="536" cy="228" r="7"/>
      </g>
    </svg>
    <span>RASTER</span>
    <span>→</span>
    <strong>BÉZIER</strong>
  </div>
</header>

<style>
  .seo-hero {
    min-height: 90svh;
    position: relative;
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    align-items: center;
    column-gap: clamp(30px, 5vw, 82px);
    row-gap: 36px;
    padding-block: clamp(90px, 11vh, 140px) 60px;
    border-bottom: 1px solid var(--story-line, #242735);
  }

  .seo-hero-copy {
    grid-column: 1 / 7;
    position: relative;
    z-index: 2;
    align-self: center;
  }

  .seo-kicker {
    display: inline-block;
    color: var(--story-accent, #60a5fa);
    font: 760 10.5px/1.3 var(--font-mono, ui-monospace, monospace);
    letter-spacing: 0.14em;
    text-transform: uppercase;
    margin-bottom: 16px;
  }

  #seoHeadline {
    max-width: 760px;
    margin: 0 0 24px;
    font-family: var(--font-sans, Inter, sans-serif);
    font-size: clamp(56px, 7.5vw, 108px);
    font-weight: 650;
    line-height: 0.88;
    letter-spacing: -0.07em;
    color: var(--story-text, #f8fafc);
  }

  .seo-hero-copy p {
    max-width: 620px;
    margin: 0 0 20px;
    font-size: clamp(15px, 1.25vw, 18px);
    line-height: 1.65;
    color: var(--story-muted, #94a3b8);
  }

  .hover-instruction {
    display: block;
    color: #64748b;
    font: 700 8.5px/1.4 var(--font-mono, ui-monospace, monospace);
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .trace-orbit {
    grid-column: 7 / 13;
    position: relative;
    width: 100%;
    align-self: center;
    color: var(--story-muted, #94a3b8);
  }

  .trace-orbit svg {
    width: 100%;
    display: block;
    overflow: visible;
  }

  .trace-grid path {
    fill: none;
    stroke: #1e2230;
    stroke-width: 1;
  }

  .trace-raster {
    fill: none;
    stroke: #475569;
    stroke-width: 3;
    opacity: 0.65;
  }

  .trace-vector {
    fill: none;
    stroke: var(--story-accent, #60a5fa);
    stroke-width: 4.5;
    stroke-linecap: round;
    stroke-dasharray: 920;
    animation: storyTrace 5s cubic-bezier(0.65, 0, 0.35, 1) infinite;
    filter: drop-shadow(0 0 12px rgba(96, 165, 250, 0.4));
  }

  .trace-nodes circle {
    fill: #0b0c11;
    stroke: #93c5fd;
    stroke-width: 3;
    animation: storyNode 5s ease infinite;
  }

  .trace-orbit > span,
  .trace-orbit > strong {
    position: absolute;
    bottom: -18px;
    font: 700 9.5px/1 var(--font-mono, ui-monospace, monospace);
    letter-spacing: 0.15em;
  }

  .trace-orbit > span:first-of-type {
    left: 6%;
  }

  .trace-orbit > span:nth-of-type(2) {
    left: 48%;
    color: var(--story-accent, #60a5fa);
  }

  .trace-orbit > strong {
    right: 8%;
    color: var(--story-text, #f8fafc);
  }

  @keyframes storyTrace {
    0%, 10% {
      stroke-dashoffset: 920;
    }
    55%, 85% {
      stroke-dashoffset: 0;
    }
    100% {
      stroke-dashoffset: -920;
    }
  }

  @keyframes storyNode {
    0%, 28% {
      opacity: 0;
      transform: scale(0.3);
      transform-origin: center;
    }
    50%, 85% {
      opacity: 1;
      transform: scale(1);
    }
    100% {
      opacity: 0;
    }
  }

  .pixel-smooth-word {
    position: relative;
    display: inline-grid;
    min-width: 3.35em;
    outline: none;
    cursor: crosshair;
    vertical-align: baseline;
  }

  .pixel-smooth-word > * {
    grid-area: 1 / 1;
  }

  .pixel-label {
    display: flex;
    align-items: baseline;
    color: inherit;
    font: inherit;
    letter-spacing: inherit;
    text-transform: none;
    clip-path: inset(-20% -8% -22% -8%);
    transition: clip-path 0.55s cubic-bezier(0.65, 0, 0.35, 1),
      color 0.3s ease,
      text-shadow 0.3s ease,
      filter 0.55s ease;
  }

  .pixel-label b {
    font: inherit;
    display: inline-block;
    transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.35s ease;
    transition-delay: calc(var(--fragment, 0) * 34ms);
  }

  .vector-label {
    color: var(--story-text, #f8fafc);
    font-family: Georgia, 'Times New Roman', serif;
    font-style: italic;
    font-weight: 400;
    clip-path: inset(0 100% 0 0);
    transform: translateY(0.015em);
    transition: clip-path 0.68s cubic-bezier(0.18, 0.78, 0.22, 1);
  }

  .word-vector-ui {
    width: 92%;
    align-self: end;
    justify-self: start;
    translate: 2% 26%;
    overflow: visible;
    opacity: 0;
    pointer-events: none;
  }

  .word-vector-ui path {
    fill: none;
    stroke: var(--story-accent, #60a5fa);
    stroke-width: 2;
    stroke-dasharray: 420;
    stroke-dashoffset: 420;
  }

  .word-nodes-group circle {
    fill: #0d0f17;
    stroke: var(--story-accent, #60a5fa);
    stroke-width: 2;
    transform-box: fill-box;
    transform-origin: center;
    transform: scale(0);
  }

  .pixel-smooth-word:hover .pixel-label,
  .pixel-smooth-word.active .pixel-label {
    clip-path: inset(-20% 102% -22% -8%);
    color: #60a5fa;
    text-shadow: 2px 0 #3b82f6, 0 2px #3b82f6, 2px 2px #1d4ed8;
    filter: contrast(1.8);
    transition-delay: 0.24s, 0s, 0s, 0s;
  }

  .pixel-smooth-word:hover .pixel-label b:nth-child(odd),
  .pixel-smooth-word.active .pixel-label b:nth-child(odd) {
    opacity: 0.35;
    transform: translateY(-0.16em) rotate(-4deg);
  }

  .pixel-smooth-word:hover .pixel-label b:nth-child(2n),
  .pixel-smooth-word.active .pixel-label b:nth-child(2n) {
    opacity: 0.35;
    transform: translateY(0.18em) rotate(5deg);
  }

  .pixel-smooth-word:hover .vector-label,
  .pixel-smooth-word.active .vector-label {
    clip-path: inset(0 0 0 0);
    transition-delay: 0.36s;
  }

  .pixel-smooth-word:hover .word-vector-ui,
  .pixel-smooth-word.active .word-vector-ui {
    opacity: 1;
  }

  .pixel-smooth-word:hover .word-vector-ui path,
  .pixel-smooth-word.active .word-vector-ui path {
    animation: wordTrace 0.9s 0.08s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  }

  .pixel-smooth-word:hover .word-nodes-group circle,
  .pixel-smooth-word.active .word-nodes-group circle {
    animation: wordNode 0.32s 0.62s ease forwards;
  }

  @keyframes wordTrace {
    to {
      stroke-dashoffset: 0;
    }
  }
  @keyframes wordNode {
    to {
      transform: scale(1);
    }
  }

  @media (max-width: 900px) {
    .seo-hero {
      min-height: auto;
      grid-template-columns: 1fr;
      padding-block: 80px 48px;
    }

    .seo-hero-copy {
      grid-column: 1 / -1;
    }

    .trace-orbit {
      grid-column: 1 / -1;
      width: min(100%, 540px);
      margin: 20px auto 30px;
    }

    #seoHeadline {
      font-size: clamp(48px, 14vw, 76px);
    }
  }
</style>
