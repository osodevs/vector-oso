import type { Point, Contour } from './types';
import type { TraceStage } from '../workers/traceProtocol';

interface Segment {
  a: Point;
  b: Point;
  aKey?: number;
  bKey?: number;
}

export type ExtractProgress = (stage: TraceStage, fraction: number) => void;

const KEY_QUANTUM = 10000;

const KEY_ORIGIN = KEY_QUANTUM;

function makePointKey(height: number): (p: Point) => number {
  const stride = Math.round((height + 2) * KEY_QUANTUM) + KEY_ORIGIN;
  return (p: Point): number =>
    (Math.round(p.x * KEY_QUANTUM) + KEY_ORIGIN) * stride +
    (Math.round(p.y * KEY_QUANTUM) + KEY_ORIGIN);
}

function interpolateEdge(p1: Point, p2: Point, val1: number, val2: number): Point {
  const diff = val1 - val2;
  const ratio = Math.abs(diff) < 1e-8 ? 0.5 : Math.max(0, Math.min(1, val1 / diff));
  return {
    x: p1.x + (p2.x - p1.x) * ratio,
    y: p1.y + (p2.y - p1.y) * ratio
  };
}

export function calculatePolygonArea(points: Point[]): number {
  if (points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    area += p1.x * p2.y - p2.x * p1.y;
  }
  return area / 2;
}

export function isPointInPolygon(p: Point, poly: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 2; i < poly.length - 1; j = i++) {
    const p1 = poly[i];
    const p2 = poly[j];
    const intersect =
      p1.y > p.y !== p2.y > p.y &&
      p.x < ((p2.x - p1.x) * (p.y - p1.y)) / (p2.y - p1.y || 1e-12) + p1.x;
    if (intersect) inside = !inside;
  }
  return inside;
}

function reverseContour(contour: Contour): Contour {
  const pts = contour.slice(0, -1).reverse();
  return [...pts, { ...pts[0] }];
}

const BAND_SAMPLES = 24;
const BAND_INSET = 0.5;

function enclosesInk(
  contour: Contour,
  mask: Uint8Array,
  width: number,
  height: number
): boolean {
  const n = contour.length - 1;
  if (n < 3) return true;

  const sampleMask = (x: number, y: number): number => {
    const px = Math.min(width - 1, Math.max(0, Math.floor(x)));
    const py = Math.min(height - 1, Math.max(0, Math.floor(y)));
    return mask[py * width + px];
  };

  let side = 0;
  for (let probe = 0; probe < 6 && side === 0; probe++) {
    const i = Math.floor((probe * n) / 6);
    const a = contour[i];
    const b = contour[i + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    if (len < 1e-9) continue;
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const nx = (-dy / len) * BAND_INSET;
    const ny = (dx / len) * BAND_INSET;
    if (isPointInPolygon({ x: mx + nx, y: my + ny }, contour)) side = 1;
    else if (isPointInPolygon({ x: mx - nx, y: my - ny }, contour)) side = -1;
  }

  let ink = 0;
  let paper = 0;
  if (side !== 0) {
    const step = Math.max(1, Math.floor(n / BAND_SAMPLES));
    for (let i = 0; i < n; i += step) {
      const a = contour[i];
      const b = contour[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      if (len < 1e-9) continue;
      const x = (a.x + b.x) / 2 + ((-dy / len) * BAND_INSET) * side;
      const y = (a.y + b.y) / 2 + ((dx / len) * BAND_INSET) * side;
      if (sampleMask(x, y) === 1) ink++;
      else paper++;
    }
  }

  if (ink || paper) return ink > paper;

  let cx = 0;
  let cy = 0;
  for (let i = 0; i < n; i++) {
    cx += contour[i].x;
    cy += contour[i].y;
  }
  return sampleMask(cx / n, cy / n) === 1;
}

export function resolveContourWindings(
  contours: Contour[],
  mask: Uint8Array,
  width: number,
  height: number,
  onProgress?: ExtractProgress
): Contour[] {
  const total = contours.length || 1;
  return contours.map((contour, i) => {
    if (onProgress && (i & 63) === 0) onProgress('orienting', i / total);
    const isClockwise = calculatePolygonArea(contour) > 0;
    return isClockwise === enclosesInk(contour, mask, width, height)
      ? contour
      : reverseContour(contour);
  });
}

function stitchSegments(
  segments: Segment[],
  width: number,
  height: number,
  mask: Uint8Array,
  onProgress?: ExtractProgress
): Contour[] {
  const pointKey = makePointKey(height);
  const adjacency = new Map<number, number[]>();

  segments.forEach((seg, idx) => {
    seg.aKey = pointKey(seg.a);
    seg.bKey = pointKey(seg.b);

    const listA = adjacency.get(seg.aKey);
    if (listA) listA.push(idx);
    else adjacency.set(seg.aKey, [idx]);

    const listB = adjacency.get(seg.bKey);
    if (listB) listB.push(idx);
    else adjacency.set(seg.bKey, [idx]);
  });

  const visited = new Uint8Array(segments.length);
  const contours: Contour[] = [];

  for (let i = 0; i < segments.length; i++) {
    if (onProgress && (i & 511) === 0) onProgress('joining', i / segments.length);
    if (visited[i]) continue;
    visited[i] = 1;

    const startSeg = segments[i];
    const loop: Point[] = [startSeg.a, startSeg.b];
    const originKey = startSeg.aKey!;
    let currentKey = startSeg.bKey!;
    let steps = 0;

    while (currentKey !== originKey && steps++ < segments.length + 2) {
      const candidates = adjacency.get(currentKey) || [];
      const nextIdx = candidates.find(c => !visited[c]);
      if (nextIdx === undefined) break;

      visited[nextIdx] = 1;
      const nextSeg = segments[nextIdx];
      const nextPt = nextSeg.aKey === currentKey ? nextSeg.b : nextSeg.a;
      currentKey = nextSeg.aKey === currentKey ? nextSeg.bKey! : nextSeg.aKey!;
      loop.push(nextPt);
    }

    if (currentKey === originKey && loop.length >= 4) {
      loop[loop.length - 1] = { ...loop[0] };
      const clamped = loop.map(p => ({
        x: Math.max(0, Math.min(width, p.x)),
        y: Math.max(0, Math.min(height, p.y))
      }));

      const deduped: Point[] = [];
      for (let k = 0; k < clamped.length; k++) {
        if (k === 0 || pointKey(clamped[k]) !== pointKey(clamped[k - 1])) {
          deduped.push(clamped[k]);
        }
      }

      if (deduped.length >= 4) {
        deduped[deduped.length - 1] = { ...deduped[0] };
        if (Math.abs(calculatePolygonArea(deduped)) > 0.01) {
          contours.push(deduped);
        }
      }
    }
  }

  return resolveContourWindings(contours, mask, width, height, onProgress);
}

export function extractSubpixelContours(
  gray: Uint8Array,
  mask: Uint8Array,
  width: number,
  height: number,
  threshold: number,
  onProgress?: ExtractProgress
): Contour[] {
  const getScalar = (x: number, y: number): number => {
    if (x < 0 || y < 0 || x >= width || y >= height) return -Math.max(1, threshold);
    const idx = y * width + x;
    const diff = threshold - gray[idx];
    return mask[idx] ? Math.max(0.001, diff) : Math.min(-0.001, diff);
  };

  const segments: Segment[] = [];
  const addSegment = (p1: Point, p2: Point) => segments.push({ a: p1, b: p2 });

  const reportEvery = 8;

  for (let y = -1; y < height; y++) {
    if (onProgress && y % reportEvery === 0) onProgress('edges', (y + 1) / (height + 1));
    for (let x = -1; x < width; x++) {
      const vTopLeft = getScalar(x, y);
      const vTopRight = getScalar(x + 1, y);
      const vBottomRight = getScalar(x + 1, y + 1);
      const vBottomLeft = getScalar(x, y + 1);

      const cellIndex =
        (vTopLeft > 0 ? 1 : 0) |
        (vTopRight > 0 ? 2 : 0) |
        (vBottomRight > 0 ? 4 : 0) |
        (vBottomLeft > 0 ? 8 : 0);

      if (cellIndex === 0 || cellIndex === 15) continue;

      const pTopLeft = { x: x + 0.5, y: y + 0.5 };
      const pTopRight = { x: x + 1.5, y: y + 0.5 };
      const pBottomRight = { x: x + 1.5, y: y + 1.5 };
      const pBottomLeft = { x: x + 0.5, y: y + 1.5 };

      const edgeTop = () => interpolateEdge(pTopLeft, pTopRight, vTopLeft, vTopRight);
      const edgeRight = () => interpolateEdge(pTopRight, pBottomRight, vTopRight, vBottomRight);
      const edgeBottom = () => interpolateEdge(pBottomLeft, pBottomRight, vBottomLeft, vBottomRight);
      const edgeLeft = () => interpolateEdge(pTopLeft, pBottomLeft, vTopLeft, vBottomLeft);

      const connectInk = true;

      switch (cellIndex) {
        case 1:
        case 14:
          addSegment(edgeLeft(), edgeTop());
          break;
        case 2:
        case 13:
          addSegment(edgeTop(), edgeRight());
          break;
        case 3:
        case 12:
          addSegment(edgeLeft(), edgeRight());
          break;
        case 4:
        case 11:
          addSegment(edgeRight(), edgeBottom());
          break;
        case 5:
          if (connectInk) {
            addSegment(edgeTop(), edgeRight());
            addSegment(edgeBottom(), edgeLeft());
          } else {
            addSegment(edgeLeft(), edgeTop());
            addSegment(edgeRight(), edgeBottom());
          }
          break;
        case 6:
        case 9:
          addSegment(edgeTop(), edgeBottom());
          break;
        case 7:
        case 8:
          addSegment(edgeLeft(), edgeBottom());
          break;
        case 10:
          if (connectInk) {
            addSegment(edgeLeft(), edgeTop());
            addSegment(edgeRight(), edgeBottom());
          } else {
            addSegment(edgeTop(), edgeRight());
            addSegment(edgeBottom(), edgeLeft());
          }
          break;
      }
    }
  }

  return stitchSegments(segments, width, height, mask, onProgress);
}

export function extractPixelContours(
  mask: Uint8Array,
  width: number,
  height: number,
  onProgress?: ExtractProgress
): Contour[] {
  const segments: Segment[] = [];

  for (let y = 0; y < height; y++) {
    if (onProgress && (y & 7) === 0) onProgress('edges', y / height);
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (!mask[idx]) continue;

      if (y === 0 || !mask[idx - width]) {
        segments.push({ a: { x, y }, b: { x: x + 1, y } });
      }
      if (x === width - 1 || !mask[idx + 1]) {
        segments.push({ a: { x: x + 1, y }, b: { x: x + 1, y: y + 1 } });
      }
      if (y === height - 1 || !mask[idx + width]) {
        segments.push({ a: { x: x + 1, y: y + 1 }, b: { x, y: y + 1 } });
      }
      if (x === 0 || !mask[idx - 1]) {
        segments.push({ a: { x, y: y + 1 }, b: { x, y } });
      }
    }
  }

  return stitchSegments(segments, width, height, mask, onProgress);
}
