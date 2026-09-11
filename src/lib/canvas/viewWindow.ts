export interface ViewWindow {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ViewWindowInput {
  width: number;
  height: number;
  panX: number;
  panY: number;
  zoomLevel: number;
  wrapWidth: number;
  wrapHeight: number;
}

export function computeViewWindow({
  width,
  height,
  panX,
  panY,
  zoomLevel,
  wrapWidth,
  wrapHeight
}: ViewWindowInput): ViewWindow | null {
  const z = zoomLevel / 100;
  if (!wrapWidth || !wrapHeight || z <= 0 || width <= 0 || height <= 0) return null;

  const visibleW = wrapWidth / z;
  const visibleH = wrapHeight / z;
  if (visibleW >= width && visibleH >= height) return null;

  const padX = visibleW * 0.5;
  const padY = visibleH * 0.5;
  const centreX = width / 2 - panX / z;
  const centreY = height / 2 - panY / z;

  const stepX = Math.max(1, Math.round(visibleW / 4));
  const stepY = Math.max(1, Math.round(visibleH / 4));
  const snapDown = (v: number, step: number) => Math.floor(v / step) * step;
  const snapUp = (v: number, step: number) => Math.ceil(v / step) * step;

  const x = Math.max(0, snapDown(centreX - visibleW / 2 - padX, stepX));
  const y = Math.max(0, snapDown(centreY - visibleH / 2 - padY, stepY));
  const right = Math.min(width, snapUp(centreX + visibleW / 2 + padX, stepX));
  const bottom = Math.min(height, snapUp(centreY + visibleH / 2 + padY, stepY));

  const w = Math.max(1, right - x);
  const h = Math.max(1, bottom - y);
  if (w >= width && h >= height) return null;
  return { x, y, w, h };
}

export const BACKING_PIXEL_BUDGET = 6_000_000;

export function backingSize(w: number, h: number, zoom: number, dpr: number) {
  let density = zoom >= 1 ? Math.min(dpr || 1, 2) : 1;

  const budget = BACKING_PIXEL_BUDGET / Math.max(1, w * zoom * h * zoom);
  if (density * density > budget) density = Math.max(0.5, Math.sqrt(budget));

  return {
    width: Math.max(1, Math.round(w * zoom * density)),
    height: Math.max(1, Math.round(h * zoom * density))
  };
}
