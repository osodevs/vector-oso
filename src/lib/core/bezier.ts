import type { Point, Contour, BezierNode, BezierContour } from './types';

export function fitBezierCurves(
  contour: Contour | { points: Point[] } | Point[] | null | undefined,
  smoothFactor = 2
): BezierContour | null {
  if (!contour) return null;

  const rawPts: Point[] = Array.isArray(contour)
    ? contour
    : Array.isArray((contour as { points?: Point[] }).points)
      ? (contour as { points: Point[] }).points
      : [];

  if (rawPts.length < 3) return null;

  const isDuplicateEnd =
    rawPts.length > 3 &&
    rawPts[0].x === rawPts[rawPts.length - 1].x &&
    rawPts[0].y === rawPts[rawPts.length - 1].y;

  const pts = isDuplicateEnd ? rawPts.slice(0, -1) : rawPts;
  if (pts.length < 3) return null;

  const s = Math.min(30, Math.max(0, smoothFactor));
  const tension = (0.36 * s) / (s + 1.3);

  return pts.map((curr, i) => {
    const prev = pts[(i - 1 + pts.length) % pts.length];
    const next = pts[(i + 1) % pts.length];

    const vPrevX = prev.x - curr.x;
    const vPrevY = prev.y - curr.y;
    const vNextX = next.x - curr.x;
    const vNextY = next.y - curr.y;

    const lenPrev = Math.hypot(vPrevX, vPrevY);
    const lenNext = Math.hypot(vNextX, vNextY);

    const dot = lenPrev && lenNext ? (vPrevX * vNextX + vPrevY * vNextY) / (lenPrev * lenNext) : 1;
    const angle = (Math.acos(Math.max(-1, Math.min(1, dot))) * 180) / Math.PI;

    const sharpness = Math.max(0, Math.min(1, (angle - 100) / 70));

    const tanX = next.x - prev.x;
    const tanY = next.y - prev.y;
    const tanLen = Math.hypot(tanX, tanY) || 1;

    const handleLength = Math.min(lenPrev, lenNext) * tension * sharpness;

    return {
      point: curr,
      tangent: { x: tanX / tanLen, y: tanY / tanLen },
      handle: handleLength
    };
  });
}

export function evaluateCubicBezier(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const invT = 1 - t;
  const invT2 = invT * invT;
  const invT3 = invT2 * invT;
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x: invT3 * p0.x + 3 * invT2 * t * p1.x + 3 * invT * t2 * p2.x + t3 * p3.x,
    y: invT3 * p0.y + 3 * invT2 * t * p1.y + 3 * invT * t2 * p2.y + t3 * p3.y
  };
}

export function sampleBezierContour(bezierNodes: BezierContour, samplesPerCurve = 6): Point[] {
  const sampled: Point[] = [];
  const samples = Math.max(2, Math.min(16, Math.round(samplesPerCurve)));

  for (let i = 0; i < bezierNodes.length; i++) {
    const curr = bezierNodes[i];
    const next = bezierNodes[(i + 1) % bezierNodes.length];

    const cp1: Point = {
      x: curr.point.x + curr.tangent.x * curr.handle,
      y: curr.point.y + curr.tangent.y * curr.handle
    };

    const cp2: Point = {
      x: next.point.x - next.tangent.x * next.handle,
      y: next.point.y - next.tangent.y * next.handle
    };

    for (let step = 0; step < samples; step++) {
      const t = step / samples;
      sampled.push(evaluateCubicBezier(curr.point, cp1, cp2, next.point, t));
    }
  }

  if (sampled.length > 0) {
    sampled.push({ ...sampled[0] });
  }

  return sampled;
}
