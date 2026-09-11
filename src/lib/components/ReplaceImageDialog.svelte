<script lang="ts">
  import type { Translations } from '../i18n';

  interface Props {
    t: Translations['replace'];
    pending: { file: File; source: 'drop' | 'paste' } | null;
    currentSrc: string | null;
    hasEdits: boolean;
    onConfirm: () => void;
    onCancel: () => void;
  }

  let { t, pending, currentSrc, hasEdits, onConfirm, onCancel }: Props = $props();

  let confirmEl = $state<HTMLButtonElement>();

  let incomingSrc = $state<string | null>(null);

  $effect(() => {
    const file = pending?.file;
    if (!file) {
      incomingSrc = null;
      return;
    }
    const url = URL.createObjectURL(file);
    incomingSrc = url;
    return () => {
      URL.revokeObjectURL(url);
      incomingSrc = null;
    };
  });

  $effect(() => {
    if (pending) confirmEl?.focus();
  });

  function handleKey(e: KeyboardEvent) {
    if (!pending) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  }

  function sizeLabel(bytes: number): string {
    return bytes > 1024 * 1024
      ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
      : `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
</script>

<svelte:window onkeydown={handleKey} />

{#if pending}

  <div class="scrim" onclick={onCancel}>

    <div
      class="dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="replace-title"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
    >
      <h2 id="replace-title">{pending.source === 'paste' ? t.titlePaste : t.titleDrop}</h2>

      <div class="compare">
        <figure class="side outgoing">
          <div class="thumb">
            {#if currentSrc}
              <img src={currentSrc} alt="" />
            {/if}
          </div>
          <figcaption>{t.currentLabel}</figcaption>
        </figure>

        <span class="arrow" aria-hidden="true">→</span>

        <figure class="side incoming">
          <div class="thumb">
            {#if incomingSrc}
              <img src={incomingSrc} alt="" />
            {/if}
          </div>
          <figcaption title={pending.file.name}>
            {pending.file.name || t.untitled}
            <span class="filesize">{sizeLabel(pending.file.size)}</span>
          </figcaption>
        </figure>
      </div>

      <p class="body">{hasEdits ? t.bodyWithEdits : t.body}</p>

      <div class="actions">
        <button type="button" class="btn-ghost" onclick={onCancel}>{t.cancel}</button>
        <button bind:this={confirmEl} type="button" class="btn-primary" onclick={onConfirm}>
          {t.confirm}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .scrim {
    position: fixed;
    inset: 0;
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: rgba(3, 5, 10, 0.72);
  }

  .dialog {
    width: 100%;
    max-width: 380px;
    padding: 20px;
    border-radius: 14px;
    background: #0f1118;
    border: 1px solid #262c3f;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6);
  }

  h2 {
    font-size: 15px;
    font-weight: 800;
    color: #f1f5f9;
    margin-bottom: 10px;
  }

  .compare {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
  }

  .side {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .thumb {
    aspect-ratio: 4 / 3;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    border-radius: 8px;
    background: #0b0c11;
    border: 1px solid #1e2232;
    overflow: hidden;
  }

  .thumb img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    display: block;
  }

  .incoming .thumb {
    border-color: rgba(59, 130, 246, 0.55);
  }

  figcaption {
    display: flex;
    align-items: baseline;
    gap: 6px;
    font-family: var(--font-mono);
    font-size: 9.5px;
    color: #64748b;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .incoming figcaption {
    color: #93c5fd;
  }

  .filesize {
    color: #475569;
    flex-shrink: 0;
    margin-left: auto;
  }

  .arrow {
    font-size: 15px;
    color: #3b82f6;
    padding-bottom: 16px;
  }

  .outgoing .thumb {
    opacity: 0.55;
  }

  .body {
    font-size: 12px;
    line-height: 1.5;
    color: #94a3b8;
    margin-bottom: 16px;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .btn-ghost,
  .btn-primary {
    padding: 8px 15px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 750;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  }

  .btn-ghost {
    background: transparent;
    border: 1px solid #2b3044;
    color: #94a3b8;
  }

  .btn-ghost:hover {
    border-color: #3b4a68;
    color: #e2e8f0;
  }

  .btn-primary {
    background: #2563eb;
    border: 1px solid #3b82f6;
    color: #ffffff;
  }

  .btn-primary:hover {
    background: #1d4ed8;
  }

  .btn-primary:focus-visible {
    outline: 2px solid #93c5fd;
    outline-offset: 2px;
  }
</style>
