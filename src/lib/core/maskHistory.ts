export interface MaskPatch {
  idx: Int32Array;

  prev: Uint8Array;
  next: Uint8Array;
}

export const MASK_HISTORY_LIMIT = 25;

export function diffMask(before: Uint8Array, after: Uint8Array): MaskPatch | null {
  let count = 0;
  for (let i = 0; i < before.length; i++) if (before[i] !== after[i]) count++;
  if (count === 0) return null;

  const idx = new Int32Array(count);
  const prev = new Uint8Array(count);
  const next = new Uint8Array(count);
  let k = 0;
  for (let i = 0; i < before.length; i++) {
    if (before[i] === after[i]) continue;
    idx[k] = i;
    prev[k] = before[i];
    next[k] = after[i];
    k++;
  }
  return { idx, prev, next };
}

export function applyPatch(mask: Uint8Array, patch: MaskPatch, direction: 'redo' | 'undo'): Uint8Array {
  const out = mask.slice();
  const values = direction === 'redo' ? patch.next : patch.prev;
  for (let k = 0; k < patch.idx.length; k++) out[patch.idx[k]] = values[k];
  return out;
}
