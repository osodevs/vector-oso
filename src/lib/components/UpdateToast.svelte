<script lang="ts">
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import type { Translations } from '../i18n';

  interface Props {
    t: Translations['pwa'];
  }

  let { t }: Props = $props();

  let needRefresh = $state(false);
  let update: ((reload?: boolean) => Promise<void>) | undefined;

  onMount(async () => {
    if (!('serviceWorker' in navigator)) return;
    try {
      const { registerSW } = await import('virtual:pwa-register');
      update = registerSW({
        immediate: true,
        onNeedRefresh: () => (needRefresh = true)
      });
    } catch {
    }
  });
</script>

{#if needRefresh}
  <div class="pwa-toast" role="status" transition:fly={{ y: 20, duration: 220 }}>
    <span>{t.updateReady}</span>
    <button type="button" class="reload" onclick={() => update?.(true)}>{t.reload}</button>
    <button
      type="button"
      class="dismiss"
      aria-label={t.dismiss}
      onclick={() => (needRefresh = false)}>×</button
    >
  </div>
{/if}

<style>
  .pwa-toast {
    position: fixed;
    z-index: 400;
    left: 50%;
    bottom: 24px;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 14px;
    max-width: calc(100vw - 32px);
    padding: 12px 12px 12px 18px;
    border: 1px solid var(--border-strong, rgba(255, 255, 255, 0.16));
    border-radius: 12px;
    background: var(--panel, #171924);
    color: var(--text, #f8fafc);
    box-shadow: 0 18px 44px rgba(0, 0, 0, 0.55);
    font-size: 13px;
  }

  button {
    flex-shrink: 0;
    border: 0;
    cursor: pointer;
    font: inherit;
  }

  .reload {
    padding: 8px 15px;
    border-radius: 8px;
    background: #2563eb;
    color: #ffffff;
    font-weight: 700;
  }

  .reload:hover {
    background: #1d4ed8;
  }

  .dismiss {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: transparent;
    color: var(--muted, #94a3b8);
    font-size: 18px;
    line-height: 1;
  }

  .dismiss:hover {
    background: var(--panel-hover, #1e2130);
    color: var(--text, #f8fafc);
  }

  @media (max-width: 640px) {
    .pwa-toast {
      bottom: 76px;
    }
  }
</style>
