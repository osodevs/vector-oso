import type { Point, Contour } from './types';
import { calculatePolygonArea } from './marchingSquares';

function getCornerAngle(prev: Point, curr: Point, next: Point): number {
  const v1x = prev.x - curr.x;
  const v1y = prev.y - curr.y;
  const v2x = next.x - curr.x;
  const v2y = next.y - curr.y;

  const len1 = Math.hypot(v1x, v1y);
  const len2 = Math.hypot(v2x, v2y);
  if (len1 === 0 || len2 === 0) return 180;

  const dot = (v1x * v2x + v1y * v2y) / (len1 * len2);
  const clampedDot = Math.max(-1, Math.min(1, dot));
  return (Math.acos(clampedDot) * 180) / Math.PI;
}

export function smoothContour(
  contour: Contour,
  smoothStrength: number,
  resolutionScale = 1
): Contour {
  if (smoothStrength <= 0 || contour.length < 6) return contour;

  const initialArea = calculatePolygonArea(contour);
  let pts = contour.slice(0, -1).map(p => ({ ...p }));

  const iterations = Math.min(5, Math.max(1, Math.floor(smoothStrength / 6) + 1));
  const factor = (0.04 + (Math.min(30, smoothStrength) / 30) * 0.16) * resolutionScale;

  for (let iter = 0; iter < iterations; iter++) {
    pts = pts.map((curr, idx, arr) => {
      const prev = arr[(idx - 1 + arr.length) % arr.length];
      const next = arr[(idx + 1) % arr.length];

      const angle = getCornerAngle(prev, curr, next);
      const cornerWeight = Math.max(0, Math.min(1, (angle - 100) / 70));
      const weight = factor * cornerWeight;

      return {
        x: curr.x * (1 - weight * 2) + prev.x * weight + next.x * weight,
        y: curr.y * (1 - weight * 2) + prev.y * weight + next.y * weight
      };
    });
  }

  const smoothedContour = [...pts, { ...pts[0] }];
  const smoothedArea = calculatePolygonArea(smoothedContour);

  if (Math.abs(initialArea) > 0.001 && Math.abs(smoothedArea) > 0.001) {
    const scale = Math.max(0.88, Math.min(1.12, Math.sqrt(Math.abs(initialArea / smoothedArea))));

    let cx = 0;
    let cy = 0;
    for (const p of pts) {
      cx += p.x / pts.length;
      cy += p.y / pts.length;
    }

    pts = pts.map(p => ({
      x: cx + (p.x - cx) * scale,
      y: cy + (p.y - cy) * scale
    }));
  }

  return [...pts, { ...pts[0] }];
}
