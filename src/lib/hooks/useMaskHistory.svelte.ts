import type { MaskEditStroke } from '../core/types';

export function useMaskHistory() {
  let maskEdits = $state<MaskEditStroke[]>([]);
  let maskHistoryIndex = $state<number>(0);

  let activeMaskEdits = $derived(
    maskEdits.slice(0, maskHistoryIndex)
  );

  let canUndoMask = $derived(maskHistoryIndex > 0);
  let canRedoMask = $derived(maskHistoryIndex < maskEdits.length);
  let hasMaskEdits = $derived(maskEdits.length > 0);

  function applyMaskEdit(stroke: MaskEditStroke) {
    const newEdits = maskEdits.slice(0, maskHistoryIndex);
    newEdits.push(stroke);
    maskEdits = newEdits;
    maskHistoryIndex = newEdits.length;
  }

  function undoMask() {
    if (canUndoMask) {
      maskHistoryIndex = Math.max(0, maskHistoryIndex - 1);
    }
  }

  function redoMask() {
    if (canRedoMask) {
      maskHistoryIndex = Math.min(maskEdits.length, maskHistoryIndex + 1);
    }
  }

  function resetMaskEdits() {
    maskEdits = [];
    maskHistoryIndex = 0;
  }

  return {
    get maskEdits() { return maskEdits; },
    get maskHistoryIndex() { return maskHistoryIndex; },
    get activeMaskEdits() { return activeMaskEdits; },
    get canUndoMask() { return canUndoMask; },
    get canRedoMask() { return canRedoMask; },
    get hasMaskEdits() { return hasMaskEdits; },
    applyMaskEdit,
    undoMask,
    redoMask,
    resetMaskEdits
  };
}
