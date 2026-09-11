import type { TraceDetail } from './tracePreference.svelte';

export const TRACE_MAX_EDGE_COMPACT = 1800;
export const TRACE_MAX_EDGE_ROOMY = 4096;

export function isMemoryConstrained(): boolean {
  if (typeof navigator === 'undefined' || typeof screen === 'undefined') return false;

  const shortEdge = Math.min(screen.width || 0, screen.height || 0);
  if (navigator.maxTouchPoints > 0 && shortEdge > 0 && shortEdge <= 520) return true;

  const deviceMemory = (navigator as { deviceMemory?: number }).deviceMemory;
  return typeof deviceMemory === 'number' && deviceMemory > 0 && deviceMemory <= 2;
}

export function traceMaxEdge(
  choice: TraceDetail = 'auto',
  demoted = false
): number {
  if (choice === 'full') return TRACE_MAX_EDGE_ROOMY;
  if (choice === 'compact') return TRACE_MAX_EDGE_COMPACT;
  return demoted || isMemoryConstrained() ? TRACE_MAX_EDGE_COMPACT : TRACE_MAX_EDGE_ROOMY;
}

export interface PixelSize {
  width: number;
  height: number;
}

export interface Resample {
  from: PixelSize;
  to: PixelSize;
}

export interface WorkingSize {
  width: number;
  height: number;

  scale: number;
}

export function fitToTraceBudget(
  width: number,
  height: number,
  maxEdge: number
): WorkingSize {
  if (width <= 0 || height <= 0) return { width, height, scale: 1 };

  const longest = Math.max(width, height);
  if (longest <= maxEdge) return { width, height, scale: 1 };

  const factor = maxEdge / longest;
  const w = Math.max(1, Math.round(width * factor));
  const h = Math.max(1, Math.round(height * factor));

  return { width: w, height: h, scale: width / w };
}
