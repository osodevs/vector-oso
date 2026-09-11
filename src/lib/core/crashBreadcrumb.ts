const KEY = 'vector-oso-stage-v1';

export type Stage = 'decode' | 'preprocess' | 'trace' | 'render';

export interface Breadcrumb {
  stage: Stage;
  width: number;
  height: number;
  contours?: number;
}

export function markStage(crumb: Breadcrumb): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(crumb));
  } catch {
  }
}

export function clearStage(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
  }
}

export function takeLastStage(): Breadcrumb | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    localStorage.removeItem(KEY);
    const parsed = JSON.parse(raw) as Breadcrumb;
    return parsed && typeof parsed.stage === 'string' ? parsed : null;
  } catch {
    return null;
  }
}
