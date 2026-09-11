<script lang="ts">
  import type { Translations } from '../../i18n';

  interface Props {
    t: Translations['canvas'];
    onFileSelected: (file: File) => void;
  }

  let { t, onFileSelected }: Props = $props();

  let fileInputEl: HTMLInputElement | undefined = $state();

  function handleFileChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      onFileSelected(file);
    }
  }
</script>

<div
  class="empty-dropzone"
  role="region"
  aria-label="File dropzone"
>
  <div class="dropzone-box">
    <div class="drop-icon-pulse">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    </div>
    <h3>{t.dropTitle}</h3>
    <p>{t.dropSubtitle}</p>
    <button
      type="button"
      class="upload-trigger-btn"
      onclick={() => fileInputEl?.click()}
    >
      {t.uploadBtn}
    </button>
    <input
      bind:this={fileInputEl}
      type="file"
      accept="image/png,image/jpeg,image/webp,image/bmp"
      class="sr-only"
      onchange={handleFileChange}
    />
  </div>
</div>

<style>
  .empty-dropzone {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: clamp(10px, 3vw, 24px);
    box-sizing: border-box;
  }

  .dropzone-box {
    max-width: 420px;
    width: 100%;
    max-height: 100%;
    border: 2px dashed #2b3248;
    border-radius: clamp(12px, 2.5vw, 18px);
    padding: clamp(16px, 3.5vh, 36px) clamp(16px, 4vw, 28px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    background: #0f1118;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
    box-sizing: border-box;
    transition: border-color 0.2s ease, transform 0.2s ease;
  }

  .dropzone-box:hover {
    border-color: #3b82f6;
    transform: translateY(-2px);
  }

  .drop-icon-pulse {
    width: clamp(44px, 8vw, 56px);
    height: clamp(44px, 8vw, 56px);
    border-radius: 50%;
    background: rgba(37, 99, 235, 0.12);
    color: #3b82f6;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: clamp(12px, 2.5vh, 20px);
    box-shadow: 0 0 24px rgba(37, 99, 235, 0.2);
  }

  .dropzone-box h3 {
    font-family: var(--font-display);
    font-size: clamp(18px, 4vw, 22px);
    font-weight: 800;
    color: #f8fafc;
    margin-bottom: 6px;
  }

  .dropzone-box p {
    font-size: clamp(12px, 2.8vw, 14px);
    color: #94a3b8;
    margin-bottom: clamp(14px, 3vh, 24px);
  }

  .upload-trigger-btn {
    background: #2563eb;
    color: #ffffff;
    padding: clamp(8px, 1.8vh, 12px) clamp(18px, 4vw, 26px);
    border-radius: 10px;
    font-size: clamp(13px, 2.8vw, 14.5px);
    font-weight: 700;
    box-shadow: 0 4px 16px rgba(37, 99, 235, 0.4);
    transition: all 0.15s ease;
  }

  .upload-trigger-btn:hover {
    background: #1d4ed8;
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(37, 99, 235, 0.5);
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
  }
</style>
