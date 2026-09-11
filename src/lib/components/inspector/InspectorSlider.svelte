<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    id: string;
    label: string;
    tooltip?: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    disabled?: boolean;
    formatValue?: (val: number) => string;
    action?: Snippet;
    autoValue?: number;
    autoHint?: string;
    onEdited?: () => void;
    onRevert?: () => void;
    showTrack?: boolean;
    bare?: boolean;
  }

  let {
    id,
    label,
    tooltip,
    value = $bindable(),
    min,
    max,
    step = 1,
    unit = '',
    disabled = false,
    formatValue,
    action,
    autoValue,
    autoHint = '',
    onEdited,
    onRevert,
    showTrack = true,
    bare = false
  }: Props = $props();

  let decimals = $derived((String(step).split('.')[1] ?? '').length);

  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  const snap = (n: number) => +(Math.round(n / step) * step).toFixed(decimals);

  function commit(next: number) {
    const v = clamp(snap(next));
    if (v === value) return;
    value = v;
    onEdited?.();
  }

  function onType(e: Event & { currentTarget: HTMLInputElement }) {
    const raw = e.currentTarget.valueAsNumber;
    if (Number.isNaN(raw) || raw < min || raw > max) return;
    commit(raw);
  }

  function onCommit(e: Event & { currentTarget: HTMLInputElement }) {
    const raw = e.currentTarget.valueAsNumber;
    if (!Number.isNaN(raw)) commit(raw);
    e.currentTarget.value = String(value);
  }

  function onKey(e: KeyboardEvent & { currentTarget: HTMLInputElement }) {
    if (e.key === 'Enter') {
      e.preventDefault();
      onCommit(e);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.currentTarget.value = String(value);
      e.currentTarget.blur();
    }
  }

  let displayValue = $derived(formatValue ? formatValue(value) : `${value}${unit}`);

  let autoAt = $derived(
    autoValue === undefined || max === min
      ? null
      : Math.max(0, Math.min(1, (autoValue - min) / (max - min)))
  );

  let isAuto = $derived(autoValue !== undefined && value === autoValue);
</script>

<div class="field-card" class:is-bare={bare}>
  <div class="field-header">
    <label for={id} class="field-label">
      <span>{label}</span>
      {#if tooltip}
        <span class="field-info" title={tooltip}>ⓘ</span>
      {/if}
    </label>
    <div class="field-trailing">
      {#if action}{@render action()}{/if}
      {#if autoValue !== undefined && !isAuto}
        <button
          type="button"
          class="auto-value"
          onclick={() => onRevert?.()}
          title={autoHint}
          {disabled}
        >auto {autoValue}</button>
      {/if}
      <span class="field-value" class:is-auto={isAuto} title={displayValue}>
        <input
          class="value-input"
          type="number"
          {min}
          {max}
          {step}
          value={value}
          {disabled}
          aria-label={label}
          oninput={onType}
          onchange={onCommit}
          onblur={onCommit}
          onkeydown={onKey}
          onfocus={(e) => e.currentTarget.select()}
        />
        {#if unit}<span class="value-unit">{unit}</span>{/if}
      </span>
    </div>
  </div>
  {#if showTrack}
    <div class="track-wrap">
      {#if autoAt !== null}
        <button
          type="button"
          class="auto-tick"
          class:is-here={isAuto}
          style:left="{autoAt * 100}%"
          onclick={() => onRevert?.()}
          title={autoHint}
          aria-label={autoHint}
          {disabled}
        ></button>
      {/if}
      <input
        {id}
        type="range"
        {min}
        {max}
        {step}
        bind:value
        oninput={() => onEdited?.()}
        ondblclick={() => onRevert?.()}
        title={autoHint}
        {disabled}
      />
    </div>
  {/if}
</div>

<style>
  .track-wrap {
    position: relative;
  }

  .auto-tick {
    position: absolute;
    top: -7px;
    width: 14px;
    height: 14px;
    margin-left: -7px;
    padding: 0;
    border: 0;
    background: transparent;
    cursor: pointer;
    z-index: 2;
  }

  .auto-tick::after {
    content: '';
    position: absolute;
    left: 6px;
    top: 4px;
    width: 2px;
    height: 6px;
    border-radius: 1px;
    background: #3b4a68;
    transition: background 0.15s ease, height 0.15s ease, top 0.15s ease;
  }

  .auto-tick:hover:not(:disabled)::after {
    background: #60a5fa;
    height: 9px;
    top: 2px;
  }

  .auto-tick.is-here::after {
    background: #3b82f6;
  }

  .auto-tick:disabled {
    cursor: default;
  }

  .field-value.is-auto {
    color: #60a5fa;
  }

  .auto-value {
    padding: 1px 5px;
    border-radius: 5px;
    border: 1px solid #262c3f;
    background: transparent;
    color: #64748b;
    font-family: var(--font-mono);
    font-size: 9px;
    font-weight: 700;
    white-space: nowrap;
    cursor: pointer;
    transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
  }

  .auto-value:hover:not(:disabled) {
    color: #93c5fd;
    border-color: rgba(59, 130, 246, 0.5);
    background: rgba(37, 99, 235, 0.12);
  }

  .auto-value:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .field-card {
    background: #11131c;
    border: 1px solid #1e2232;
    padding: 10px 12px;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    transition: border-color 0.15s ease;
  }

  .field-card:hover {
    border-color: #2b3044;
  }

  .field-card.is-bare,
  .field-card.is-bare:hover {
    background: transparent;
    border-color: transparent;
    padding: 0;
  }

  .field-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .field-label {
    font-size: 11px;
    font-weight: 700;
    color: #cbd5e1;
    display: flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
  }

  .field-info {
    font-size: 10px;
    color: #64748b;
    cursor: help;
  }

  .field-trailing {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }

  .field-value {
    display: inline-flex;
    align-items: baseline;
    gap: 1px;
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    color: #60a5fa;
    background: rgba(37, 99, 235, 0.1);
    padding: 1px 6px;
    border-radius: 4px;
    border: 1px solid rgba(37, 99, 235, 0.2);
    transition: border-color 0.15s ease, background 0.15s ease;
  }

  .field-value:focus-within {
    border-color: rgba(96, 165, 250, 0.65);
    background: rgba(37, 99, 235, 0.2);
  }

  .value-input {
    font: inherit;
    color: inherit;
    background: transparent;
    border: 0;
    padding: 0;
    margin: 0;
    text-align: right;
    outline: none;
    width: 4ch;
    appearance: textfield;
    -moz-appearance: textfield;
  }

  .value-input::-webkit-outer-spin-button,
  .value-input::-webkit-inner-spin-button {
    appearance: none;
    margin: 0;
  }

  .value-input:disabled {
    cursor: not-allowed;
  }

  .value-unit {
    opacity: 0.8;
  }

  input[type='range'] {
    width: 100%;
    height: 4px;
    background: #1c202d;
    border-radius: 2px;
    outline: none;
    appearance: none;
    cursor: pointer;
    accent-color: #2563eb;
  }

  input[type='range']:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  input[type='range']::-webkit-slider-thumb {
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    box-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
    border: 2px solid #ffffff;
    transition: transform 0.1s ease;
  }

  input[type='range']::-webkit-slider-thumb:hover {
    transform: scale(1.15);
  }

  @media (max-width: 900px) {
    .field-card {
      padding: 7px 10px;
      gap: 6px;
    }
  }
</style>
