import type { Point } from '../core/types';

export function getCanvasImageCoords(
  clientX: number,
  clientY: number,
  rect: DOMRect | { left: number; top: number; width: number; height: number },
  panX: number,
  panY: number,
  zoomLevel: number,
  imageWidth: number,
  imageHeight: number,
  snapToPixel = true
): Point {
  if (imageWidth === 0 || imageHeight === 0 || !rect) {
    return { x: 0, y: 0 };
  }

  const clickX = clientX - rect.left;
  const clickY = clientY - rect.top;
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  const currentScale = zoomLevel / 100;

  const imgX = (clickX - centerX - panX) / currentScale + imageWidth / 2;
  const imgY = (clickY - centerY - panY) / currentScale + imageHeight / 2;

  const x = Math.max(0, Math.min(imageWidth, imgX));
  const y = Math.max(0, Math.min(imageHeight, imgY));

  return snapToPixel ? { x: Math.round(x), y: Math.round(y) } : { x, y };
}

export function strokePointsToSvgPath(points: Point[]): string {
  if (points.length === 0) return '';
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x.toFixed(1)} ${points[i].y.toFixed(1)}`;
  }
  return d;
}

export function rasterizeMaskEdit(
  width: number,
  height: number,
  currentMask: Uint8Array,
  edit: {
    type: 'brush' | 'lasso' | 'move';
    action: 'add' | 'remove' | 'auto';
    points: Point[];
    radius: number;

    region?: 'inside' | 'outside';
  },
  initialAutoMask: Uint8Array | null
): Uint8Array {
  if (edit.points.length === 0 || edit.type === 'move') return currentMask;

  const offCanvas = document.createElement('canvas');
  offCanvas.width = width;
  offCanvas.height = height;
  const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
  if (!offCtx) return currentMask;

  offCtx.fillStyle = '#ffffff';
  offCtx.strokeStyle = '#ffffff';

  if (edit.type === 'lasso') {
    offCtx.beginPath();
    edit.points.forEach((p, i) => (i === 0 ? offCtx.moveTo(p.x, p.y) : offCtx.lineTo(p.x, p.y)));
    offCtx.closePath();
    offCtx.fill();
  } else if (edit.type === 'brush') {
    const r = Math.max(1, edit.radius);
    offCtx.lineWidth = r * 2;
    offCtx.lineCap = 'round';
    offCtx.lineJoin = 'round';

    if (edit.points.length === 1) {
      offCtx.beginPath();
      offCtx.arc(edit.points[0].x, edit.points[0].y, r, 0, Math.PI * 2);
      offCtx.fill();
    } else {
      offCtx.beginPath();
      edit.points.forEach((p, i) => (i === 0 ? offCtx.moveTo(p.x, p.y) : offCtx.lineTo(p.x, p.y)));
      offCtx.stroke();
    }
  }

  const patchData = offCtx.getImageData(0, 0, width, height).data;
  const newMask = currentMask.slice();

  const invert = edit.type === 'lasso' && edit.region === 'outside';

  for (let i = 0; i < newMask.length; i++) {
    if ((patchData[i * 4 + 3] > 64) !== invert) {
      if (edit.action === 'add') {
        newMask[i] = 1;
      } else if (edit.action === 'remove') {
        newMask[i] = 0;
      } else if (edit.action === 'auto' && initialAutoMask) {
        newMask[i] = initialAutoMask[i];
      }
    }
  }

  return newMask;
}
