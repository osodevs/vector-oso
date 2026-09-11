<script lang="ts">
  import type { Translations } from '../../i18n';

  interface Props {
    t: Translations['inspector'];
    activePreset: string;
    presetDirty?: boolean;
    disabled: boolean;
    onSelectPreset: (preset: string) => void;
    onReset: () => void;
  }

  let {
    t,
    activePreset,
    presetDirty = false,
    disabled,
    onSelectPreset,
    onReset
  }: Props = $props();

  function handleChange(e: Event) {
    const val = (e.target as HTMLSelectElement).value;
    onSelectPreset(val);
  }

  let presetLabels = $derived<Record<string, string>>({
    default: t.presetDefault,
    plotter: t.presetDrawing,
    cutter: t.presetLogo,
    laser: t.presetLaser,
    stencil: t.presetStencil
  });
</script>

<div class="inspector-topbar">
  <span class="preset-label">{t.title}</span>

  <div class="preset-dropdown-wrap" class:dirty={presetDirty}>
    <select
      class="preset-select"
      value={activePreset}
      onchange={handleChange}
      {disabled}
      aria-label={t.title}
      title={presetDirty
        ? `${presetLabels[activePreset]} · ${t.presetEdited}`
        : presetLabels[activePreset]}
    >
      {#each Object.entries(presetLabels) as [id, label]}
        <option value={id}>{label}</option>
      {/each}
    </select>
    {#if presetDirty}
      <span class="dirty-dot" title={t.presetEdited} aria-hidden="true"></span>
    {/if}
    <span class="caret">▾</span>
  </div>

  <button
    type="button"
    class="reset-btn"
    onclick={onReset}
    {disabled}
    title={t.reset}
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
      <path d="M3 3v5h5"/>
    </svg>
  </button>
</div>

<style>
  .inspector-topbar {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 12px;
    border-bottom: 1px solid #1a1d2c;
    background: #0f1118;
    flex-shrink: 0;
  }

  .preset-label {
    font-size: 9.5px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #64748b;
    white-space: nowrap;
  }

  .preset-dropdown-wrap {
    position: relative;
    flex: 1;
    display: flex;
    align-items: center;
  }

  .preset-select {
    width: 100%;
    appearance: none;
    background: #151824;
    border: 1px solid #282d42;
    border-radius: 6px;
    padding: 5px 22px 5px 8px;
    color: #f1f5f9;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .preset-dropdown-wrap.dirty .preset-select {
    border-color: rgba(245, 158, 11, 0.45);
    background: rgba(245, 158, 11, 0.06);
    color: #fbbf24;
  }

  .dirty-dot {
    position: absolute;
    right: 20px;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #f59e0b;
    box-shadow: 0 0 6px rgba(245, 158, 11, 0.8);
    pointer-events: none;
  }

  .preset-select:hover:not(:disabled) {
    border-color: #3b82f6;
    background: #1a1e2e;
  }

  .preset-select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }

  .preset-select:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .caret {
    position: absolute;
    right: 8px;
    font-size: 8px;
    color: #64748b;
    pointer-events: none;
  }

  .reset-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #151824;
    border: 1px solid #282d42;
    border-radius: 6px;
    color: #94a3b8;
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.15s ease;
  }

  .reset-btn:hover:not(:disabled) {
    background: #1e2336;
    color: #f1f5f9;
    border-color: #3b82f6;
  }

  .reset-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
</style>
