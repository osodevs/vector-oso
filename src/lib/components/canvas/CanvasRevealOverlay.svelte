<script lang="ts">
  import { onMount } from 'svelte';
  import { REVEAL_SECONDS } from '../../core/revealChoreography';
  import type { RevealTiming, RevealStyle } from '../../core/revealChoreography';
  import { REVEAL_STYLE_DEFS } from '../../core/revealChoreography';

  interface Props {
    width: number;
    height: number;
    paths: string[];
    timings: RevealTiming[];
    style?: RevealStyle;
    duration?: number;
    accent?: string;
    accentWarm?: string;
    carveMassPath?: string;
    fullAreaPath?: string;
    onDone?: () => void;
  }

  let {
    width,
    height,
    paths,
    timings,
    style = 'sweep',
    duration = REVEAL_SECONDS,
    accent = '#60a5fa',
    accentWarm = '#e8c37a',
    carveMassPath = '',
    fullAreaPath = '',
    onDone
  }: Props = $props();

  let edge = $derived(REVEAL_STYLE_DEFS[style].edge);
  let areaTreatment = $derived(REVEAL_STYLE_DEFS[style].area);
  let perShapeAreas = $derived(
    areaTreatment === 'bloom' || areaTreatment === 'develop' || areaTreatment === 'flood'
  );

  let sweepEl = $state<HTMLElement>();
  let finished = false;

  function finish() {
    if (finished) return;
    finished = true;
    onDone?.();
  }

  onMount(() => {
    const id = setTimeout(finish, (duration + 0.6) * 1000);
    return () => clearTimeout(id);
  });

  let inkWidth = $derived(Math.max(1, Math.min(width, height) / 300));
</script>

<div
  class="reveal"
  style:--dur="{duration}s"
  style:--accent={accent}
  style:--accent-warm={accentWarm}
  aria-hidden="true"
>
  {#if areaTreatment === 'carve' && carveMassPath}
    <svg class="area-layer" viewBox="0 0 {width} {height}" {width} {height}>
      <path class="carve-mass" d={carveMassPath} fill-rule="nonzero" />
      {#if fullAreaPath}
        <path class="carve-detail" d={fullAreaPath} fill-rule="nonzero" />
      {/if}
    </svg>
  {/if}

  {#if perShapeAreas}
    <svg class="area-layer" viewBox="0 0 {width} {height}" {width} {height}>
      {#each paths as d, i}
        {#if d && timings[i]?.ink !== false}
          {#if areaTreatment === 'bloom'}
            <path
              {d}
              class="area area-pulse"
              fill-rule="nonzero"
              style:--delay="{timings[i]?.delay ?? 0}s"
              style:--ink-dur="{timings[i]?.dur ?? 0.6}s"
            />
            <path
              {d}
              class="area area-core"
              fill-rule="nonzero"
              style:--delay="{timings[i]?.delay ?? 0}s"
              style:--ink-dur="{timings[i]?.dur ?? 0.6}s"
            />
          {:else if areaTreatment === 'develop'}
            <path
              {d}
              class="area area-develop"
              fill-rule="nonzero"
              style:--delay="{timings[i]?.delay ?? 0}s"
              style:--ink-dur="{timings[i]?.dur ?? 0.6}s"
            />
          {:else}
            <path
              {d}
              class="area area-flood"
              fill-rule="nonzero"
              style:--delay="{timings[i]?.delay ?? 0}s"
              style:--ink-dur="{timings[i]?.dur ?? 0.6}s"
            />
          {/if}
        {/if}
      {/each}
    </svg>
  {/if}

  <svg class="ink-layer" viewBox="0 0 {width} {height}" {width} {height}>
    {#each paths as d, i}
      {#if d && timings[i]?.ink !== false}
        <path
          {d}
          class="ink"
          pathLength="1"
          stroke-width={inkWidth}
          style:--delay="{timings[i]?.delay ?? 0}s"
          style:--ink-dur="{timings[i]?.dur ?? 0.6}s"
        />
      {/if}
    {/each}
  </svg>

  {#if edge === 'bar'}
    <div
      class="sweep"
      bind:this={sweepEl}
      onanimationend={(e) => {
        if (e.target === sweepEl) finish();
      }}
    >
      <div class="sweep-haze"></div>
      <div class="sweep-bloom"></div>
      <div class="sweep-core"></div>
    </div>
  {:else if edge === 'ring'}
    <div
      class="ring"
      bind:this={sweepEl}
      onanimationend={(e) => {
        if (e.target === sweepEl) finish();
      }}
    ></div>
  {/if}
</div>

<style>
  .reveal {
    position: absolute;
    inset: 0;
    z-index: 6;
    pointer-events: none;
    overflow: hidden;
  }

  .ink-layer {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .area-layer {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .area {
    transform-box: fill-box;
    transform-origin: center;
    opacity: 0;
    will-change: transform, opacity;
  }

  .area-pulse {
    fill: var(--accent-warm);
    animation: area-pulse calc(var(--ink-dur) * 1.5) cubic-bezier(0.16, 0.9, 0.3, 1)
      var(--delay) both;
  }

  @keyframes area-pulse {
    0% {
      opacity: 0;
      transform: scale(0.82);
    }
    28% {
      opacity: 0.3;
    }
    100% {
      opacity: 0;
      transform: scale(1.08);
    }
  }

  .area-core {
    fill: color-mix(in srgb, var(--accent) 38%, transparent);
    animation: area-core calc(var(--ink-dur) * 1.7) cubic-bezier(0.22, 1, 0.36, 1)
      calc(var(--delay) + var(--ink-dur) * 0.18) both;
  }

  @keyframes area-core {
    0% {
      opacity: 0;
      transform: scale(0.94);
    }
    45% {
      opacity: 0.42;
      transform: scale(1.01);
    }
    72% {
      opacity: 0.3;
    }
    100% {
      opacity: 0;
      transform: scale(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .area,
    .carve-mass,
    .carve-detail {
      display: none;
    }
  }

  .carve-mass {
    fill: color-mix(in srgb, var(--accent) 46%, transparent);
    opacity: 0;
    animation: carve-mass calc(var(--dur) * 0.62) cubic-bezier(0.3, 0.9, 0.4, 1) both;
    will-change: opacity;
  }

  @keyframes carve-mass {
    0% { opacity: 0; }
    22% { opacity: 1; }
    62% { opacity: 1; }
    100% { opacity: 0; }
  }

  .carve-detail {
    fill: color-mix(in srgb, var(--accent) 40%, transparent);
    opacity: 0;
    animation: carve-detail calc(var(--dur) * 0.55) cubic-bezier(0.3, 0.9, 0.4, 1)
      calc(var(--dur) * 0.42) both;
    will-change: opacity;
  }

  @keyframes carve-detail {
    0% { opacity: 0; }
    30% { opacity: 1; }
    68% { opacity: 1; }
    100% { opacity: 0; }
  }

  .area-develop {
    fill: color-mix(in srgb, var(--accent) 52%, transparent);
    animation: area-develop calc(var(--ink-dur) * 2.1) cubic-bezier(0.4, 0, 0.5, 1)
      var(--delay) both;
    will-change: opacity;
  }

  @keyframes area-develop {
    0% { opacity: 0; }
    35% { opacity: 0.22; }
    55% { opacity: 0.62; }
    70% { opacity: 0.72; }
    100% { opacity: 0; }
  }

  .area-flood {
    fill: color-mix(in srgb, var(--accent) 50%, transparent);
    transform-box: fill-box;
    transform-origin: center;
    animation: area-flood calc(var(--ink-dur) * 1.9) cubic-bezier(0.25, 0.8, 0.35, 1)
      var(--delay) both;
  }

  @keyframes area-flood {
    0% {
      opacity: 0.9;
      clip-path: circle(0% at 50% 50%);
    }
    12% {
      opacity: 0.9;
    }
    72% {
      opacity: 0.75;
      clip-path: circle(78% at 50% 50%);
    }
    100% {
      opacity: 0;
      clip-path: circle(78% at 50% 50%);
    }
  }

  .ink {
    fill: none;
    stroke: var(--accent);
    stroke-linejoin: round;
    stroke-linecap: round;
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    opacity: 0;
    animation: ink-draw var(--ink-dur) cubic-bezier(0.16, 0.84, 0.34, 1) var(--delay) both;
  }

  @keyframes ink-draw {
    0% {
      stroke-dashoffset: 1;
      opacity: 0;
    }
    14% {
      opacity: 1;
    }
    58% {
      stroke-dashoffset: 0;
      opacity: 1;
    }
    78% {
      opacity: 0.85;
    }
    100% {
      stroke-dashoffset: 0;
      opacity: 0;
    }
  }

  .sweep {
    position: absolute;
    top: -6%;
    left: 0;
    height: 112%;
    width: 100%;
    transform: translateX(-100%);
    animation: sweep-move var(--dur) cubic-bezier(0.5, 0.02, 0.24, 1) both;
    will-change: transform;
  }

  @keyframes sweep-move {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(0%);
    }
  }

  .sweep-haze {
    position: absolute;
    inset: -10% -4%;
    transform: rotate(-2.5deg);
    background: linear-gradient(
      96deg,
      transparent 0%,
      color-mix(in srgb, var(--accent) 3%, transparent) 55%,
      color-mix(in srgb, var(--accent) 9%, transparent) 88%,
      transparent 100%
    );
    animation: sweep-fade var(--dur) ease-out both;
  }

  .sweep-bloom {
    position: absolute;
    inset: -10% -4%;
    transform: rotate(-2.5deg);
    background: linear-gradient(
      96deg,
      transparent 62%,
      color-mix(in srgb, var(--accent) 10%, transparent) 84%,
      color-mix(in srgb, var(--accent) 20%, transparent) 95%,
      color-mix(in srgb, var(--accent) 8%, transparent) 99%,
      transparent 100%
    );
    filter: blur(6px);
    animation: sweep-fade var(--dur) ease-out both;
  }

  .sweep-core {
    position: absolute;
    inset: -10% -4%;
    transform: rotate(-2.5deg);
    background: linear-gradient(
      96deg,
      transparent 88%,
      color-mix(in srgb, var(--accent) 22%, transparent) 96.5%,
      color-mix(in srgb, #ffffff 34%, transparent) 99%,
      transparent 100%
    );
    filter: blur(2.5px);
    animation: sweep-fade var(--dur) ease-out both;
  }

  @keyframes sweep-fade {
    0% {
      opacity: 0;
    }
    12% {
      opacity: 1;
    }
    82% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }

  .ring {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    transform: translate(-50%, -50%) scale(0);
    background: radial-gradient(
      circle,
      transparent 58%,
      color-mix(in srgb, var(--accent) 12%, transparent) 76%,
      color-mix(in srgb, var(--accent) 30%, transparent) 90%,
      color-mix(in srgb, var(--accent) 55%, transparent) 97%,
      transparent 100%
    );
    animation: ring-grow var(--dur) cubic-bezier(0.33, 0.03, 0.28, 1) both;
    will-change: transform, opacity;
  }

  @keyframes ring-grow {
    0% {
      transform: translate(-50%, -50%) scale(0);
      opacity: 0;
    }
    10% {
      opacity: 1;
    }
    80% {
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -50%) scale(1.6);
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .reveal {
      display: none;
    }
  }
</style>
