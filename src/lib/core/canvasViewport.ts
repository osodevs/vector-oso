import type { Point } from './types';

export const MIN_ZOOM = 10;
export const MAX_ZOOM = 2000;
export const ZOOM_STEP = 25;

export interface ViewportState {
  zoomLevel: number;
  panX: number;
  panY: number;
}

export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(zoom)));
}

const MIN_VISIBLE_FRACTION = 0.25;

export function calculateClampedPan(
  panX: number,
  panY: number,
  zoomLevel: number,
  imageWidth: number,
  imageHeight: number,
  containerWidth: number,
  containerHeight: number
): Point {
  if (imageWidth === 0 || imageHeight === 0 || containerWidth === 0 || containerHeight === 0) {
    return { x: panX, y: panY };
  }

  const scale = zoomLevel / 100;
  const scaledW = imageWidth * scale;
  const scaledH = imageHeight * scale;

  const minVisibleX = Math.min(scaledW, containerWidth) * MIN_VISIBLE_FRACTION;
  const minVisibleY = Math.min(scaledH, containerHeight) * MIN_VISIBLE_FRACTION;

  const maxPanX = Math.max(0, (scaledW + containerWidth) / 2 - minVisibleX);
  const maxPanY = Math.max(0, (scaledH + containerHeight) / 2 - minVisibleY);

  return {
    x: Math.max(-maxPanX, Math.min(maxPanX, panX)),
    y: Math.max(-maxPanY, Math.min(maxPanY, panY))
  };
}

export function calculateFitToScreen(
  imageWidth: number,
  imageHeight: number,
  containerWidth: number,
  containerHeight: number,
  padding: number = 32
): ViewportState {
  if (imageWidth === 0 || imageHeight === 0 || containerWidth === 0 || containerHeight === 0) {
    return { zoomLevel: 100, panX: 0, panY: 0 };
  }

  const availW = Math.max(50, containerWidth - padding * 2);
  const availH = Math.max(50, containerHeight - padding * 2);

  const scaleX = availW / imageWidth;
  const scaleY = availH / imageHeight;
  const fitScale = Math.min(scaleX, scaleY, 1.0);

  return {
    zoomLevel: clampZoom(fitScale * 100),
    panX: 0,
    panY: 0
  };
}

export function zoomAtPoint(
  targetZoom: number,
  cursorX: number,
  cursorY: number,
  currentViewport: ViewportState,
  imageWidth: number,
  imageHeight: number,
  containerWidth: number,
  containerHeight: number
): ViewportState {
  const newZoom = clampZoom(targetZoom);
  if (newZoom === currentViewport.zoomLevel) return currentViewport;

  const oldScale = currentViewport.zoomLevel / 100;
  const newScale = newZoom / 100;

  const centerOffsetX = cursorX - containerWidth / 2;
  const centerOffsetY = cursorY - containerHeight / 2;

  const imgRelX = (centerOffsetX - currentViewport.panX) / oldScale;
  const imgRelY = (centerOffsetY - currentViewport.panY) / oldScale;

  const rawPanX = centerOffsetX - imgRelX * newScale;
  const rawPanY = centerOffsetY - imgRelY * newScale;

  const clamped = calculateClampedPan(
    rawPanX,
    rawPanY,
    newZoom,
    imageWidth,
    imageHeight,
    containerWidth,
    containerHeight
  );

  return {
    zoomLevel: newZoom,
    panX: clamped.x,
    panY: clamped.y
  };
}

export function screenToImagePoint(
  screenX: number,
  screenY: number,
  viewport: ViewportState,
  containerWidth: number,
  containerHeight: number,
  imageWidth: number,
  imageHeight: number
): Point {
  const scale = viewport.zoomLevel / 100;
  const centerOffsetX = screenX - containerWidth / 2;
  const centerOffsetY = screenY - containerHeight / 2;

  const imgRelX = (centerOffsetX - viewport.panX) / scale;
  const imgRelY = (centerOffsetY - viewport.panY) / scale;

  return {
    x: imgRelX + imageWidth / 2,
    y: imgRelY + imageHeight / 2
  };
}
