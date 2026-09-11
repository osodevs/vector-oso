import type { Point, Contour } from './types';

function getPerpendicularDistanceSq(p: Point, p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;

  if (dx === 0 && dy === 0) {
    const distDx = p.x - p1.x;
    const distDy = p.y - p1.y;
    return distDx * distDx + distDy * distDy;
  }

  const t = Math.max(0, Math.min(1, ((p.x - p1.x) * dx + (p.y - p1.y) * dy) / (dx * dx + dy * dy)));
  const projX = p1.x + t * dx;
  const projY = p1.y + t * dy;

  const diffX = p.x - projX;
  const diffY = p.y - projY;
  return diffX * diffX + diffY * diffY;
}

function simplifyOpenPolyline(points: Point[], epsilon: number): Point[] {
  if (points.length <= 2) return points;

  const keepFlags = new Uint8Array(points.length);
  keepFlags[0] = 1;
  keepFlags[points.length - 1] = 1;

  const stack: [number, number][] = [[0, points.length - 1]];
  const epsilonSq = epsilon * epsilon;

  while (stack.length > 0) {
    const [startIdx, endIdx] = stack.pop()!;
    let maxDistSq = epsilonSq;
    let maxIdx = -1;

    for (let i = startIdx + 1; i < endIdx; i++) {
      const distSq = getPerpendicularDistanceSq(points[i], points[startIdx], points[endIdx]);
      if (distSq > maxDistSq) {
        maxDistSq = distSq;
        maxIdx = i;
      }
    }

    if (maxIdx >= 0) {
      keepFlags[maxIdx] = 1;
      stack.push([startIdx, maxIdx], [maxIdx, endIdx]);
    }
  }

  return points.filter((_, idx) => keepFlags[idx] === 1);
}

export function simplifyContour(contour: Contour, tolerance: number): Contour {
  const pts = contour.slice(0, -1);
  if (pts.length < 5 || tolerance <= 0) return contour;

  let maxDistSq = 0;
  let splitIdx = 1;
  for (let i = 1; i < pts.length; i++) {
    const distSq = (pts[i].x - pts[0].x) ** 2 + (pts[i].y - pts[0].y) ** 2;
    if (distSq > maxDistSq) {
      maxDistSq = distSq;
      splitIdx = i;
    }
  }

  const poly1 = pts.slice(0, splitIdx + 1);
  const poly2 = [...pts.slice(splitIdx), pts[0]];

  const simplified1 = simplifyOpenPolyline(poly1, tolerance);
  const simplified2 = simplifyOpenPolyline(poly2, tolerance);

  const merged = [...simplified1.slice(0, -1), ...simplified2];

  return [...merged, { ...merged[0] }];
}
