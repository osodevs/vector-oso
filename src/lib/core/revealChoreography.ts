import type { Point } from './types';

export type RevealStyle =
  | 'sweep'
  | 'wavefront'
  | 'pathfind'
  | 'cascade'
  | 'bloom'
  | 'carve'
  | 'develop'
  | 'flood';

export type RevealAreaTreatment = 'none' | 'bloom' | 'carve' | 'develop' | 'flood';
export type RevealStyleSetting = RevealStyle | 'random';

export const REVEAL_SECONDS = 4.2;

export interface RevealTiming {
  delay: number;
  dur: number;
  ink: boolean;
  mass: boolean;
}

const MAX_INK_PATHS = 48;

export interface RevealStyleDef {
  label: string;
  hint: string;
  order: (bounds: Bounds[], width: number, height: number) => number[];
  edge: 'bar' | 'ring' | 'none';
  transition: 'wipe-linear' | 'wipe-radial' | 'dissolve';
  area: RevealAreaTreatment;
  jitter: number;
}

export const REVEAL_STYLE_DEFS: Record<RevealStyle, RevealStyleDef> = {
  sweep: {
    label: 'Sweep',
    hint: 'Linear bar converts the image as it passes',
    order: (bounds, width) => bounds.map((b) => Math.max(0, Math.min(1, b.minX / width))),
    edge: 'bar',
    transition: 'wipe-linear',
    area: 'none',
    jitter: 0.11
  },

  wavefront: {
    label: 'Wavefront',
    hint: 'Breadth-first expansion in rings from a seed',
    order: (bounds) => {
      let sx = 0, sy = 0;
      for (const b of bounds) { sx += b.cx; sy += b.cy; }
      sx /= bounds.length; sy /= bounds.length;
      const dists = bounds.map((b) => Math.hypot(b.cx - sx, b.cy - sy));
      const maxD = Math.max(...dists) || 1;
      return dists.map((d) => d / maxD);
    },
    edge: 'ring',
    transition: 'wipe-radial',
    area: 'none',
    jitter: 0.11
  },

  pathfind: {
    label: 'Pathfinder',
    hint: 'Greedy nearest-neighbour hop between shapes',
    order: (bounds) => {
      const n = bounds.length;
      const order = nearestNeighbourOrder(bounds);
      return order.map((step) => (n === 1 ? 0 : step / (n - 1)));
    },
    edge: 'none',
    transition: 'dissolve',
    area: 'none',
    jitter: 0.03
  },

  cascade: {
    label: 'Cascade',
    hint: 'Large masses first, fine detail last',
    order: (bounds) => {
      const maxArea = Math.max(...bounds.map((b) => b.area)) || 1;
      return bounds.map((b) => 1 - b.area / maxArea);
    },
    edge: 'none',
    transition: 'dissolve',
    area: 'none',
    jitter: 0.11
  },

  bloom: {
    label: 'Bloom',
    hint: 'Areas grow in with their outlines, detail first',
    order: (bounds) => {
      const maxArea = Math.max(...bounds.map((b) => b.area)) || 1;
      return bounds.map((b) => b.area / maxArea);
    },
    edge: 'none',
    transition: 'dissolve',
    area: 'bloom',
    jitter: 0.11
  },

  carve: {
    label: 'Carve',
    hint: 'Solid masses land, then detail subtracts out',
    order: (bounds) => {
      const n = bounds.length;
      const depth = new Array<number>(n).fill(0);
      for (let i = 0; i < n; i++) {
        const a = bounds[i];
        for (let j = 0; j < n; j++) {
          if (i === j) continue;
          const b = bounds[j];
          if (b.area <= a.area) continue;
          if (a.minX >= b.minX && a.maxX <= b.maxX && a.minY >= b.minY && a.maxY <= b.maxY) {
            depth[i]++;
          }
        }
      }
      const maxDepth = Math.max(1, ...depth);
      return depth.map((d) => d / maxDepth);
    },
    edge: 'none',
    transition: 'dissolve',
    area: 'carve',
    jitter: 0.02
  },

  develop: {
    label: 'Develop',
    hint: 'Densities rise unevenly, like a print in developer',
    order: (bounds) => bounds.map((_, i) => ((((i + 1) * 2654435761) >>> 0) % 1000) / 1000),
    edge: 'none',
    transition: 'dissolve',
    area: 'develop',
    jitter: 0.16
  },

  flood: {
    label: 'Flood',
    hint: 'Fill spreads outward inside each shape',
    order: (bounds) => {
      let sx = 0, sy = 0;
      for (const b of bounds) { sx += b.cx; sy += b.cy; }
      sx /= bounds.length; sy /= bounds.length;
      const dists = bounds.map((b) => Math.hypot(b.cx - sx, b.cy - sy));
      const maxD = Math.max(...dists) || 1;
      return dists.map((d) => d / maxD);
    },
    edge: 'none',
    transition: 'dissolve',
    area: 'flood',
    jitter: 0.09
  }
};

export const CONCRETE_STYLES = Object.keys(REVEAL_STYLE_DEFS) as RevealStyle[];

export const REVEAL_STYLES: Array<{ id: RevealStyleSetting; label: string; hint: string }> = [
  { id: 'random', label: 'Überraschung', hint: 'Bei jedem Bild eine andere Choreografie' },
  ...CONCRETE_STYLES.map((id) => ({
    id: id as RevealStyleSetting,
    label: REVEAL_STYLE_DEFS[id].label,
    hint: REVEAL_STYLE_DEFS[id].hint
  }))
];

export function resolveRevealStyle(
  setting: RevealStyleSetting,
  previous?: RevealStyle
): RevealStyle {
  if (setting !== 'random') return setting;
  const pool = previous
    ? CONCRETE_STYLES.filter((s) => s !== previous)
    : CONCRETE_STYLES;
  return pool[Math.floor(Math.random() * pool.length)];
}

interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  cx: number;
  cy: number;
  span: number;
  area: number;
}

function measure(c: Point[]): Bounds {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < c.length; i++) {
    const p = c[i];
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  if (!Number.isFinite(minX)) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0, cx: 0, cy: 0, span: 0, area: 0 };
  }
  const w = maxX - minX;
  const h = maxY - minY;
  return {
    minX, maxX, minY, maxY,
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
    span: Math.max(w, h),
    area: w * h
  };
}

function jitter(i: number): number {
  return ((((i + 1) * 2654435761) >>> 0) % 1000) / 1000 - 0.5;
}

function nearestNeighbourOrder(bounds: Bounds[]): number[] {
  const n = bounds.length;
  const order = new Array<number>(n);
  const used = new Uint8Array(n);

  let current = 0;
  for (let i = 1; i < n; i++) {
    if (bounds[i].cx < bounds[current].cx) current = i;
  }

  for (let step = 0; step < n; step++) {
    order[current] = step;
    used[current] = 1;
    let best = -1;
    let bestDist = Infinity;
    for (let i = 0; i < n; i++) {
      if (used[i]) continue;
      const dx = bounds[i].cx - bounds[current].cx;
      const dy = bounds[i].cy - bounds[current].cy;
      const d = dx * dx + dy * dy;
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    if (best === -1) break;
    current = best;
  }
  return order;
}

export function computeRevealTimings(
  contours: Point[][],
  width: number,
  height: number,
  style: RevealStyle,
  total: number
): RevealTiming[] {
  if (width === 0 || height === 0 || contours.length === 0) return [];

  const bounds = contours.map(measure);
  const n = bounds.length;
  const maxDim = Math.max(width, height);

  const def = REVEAL_STYLE_DEFS[style];
  const jitterAmount = def.jitter;

  const ranked =
    n > MAX_INK_PATHS
      ? bounds
          .map((b, i) => ({ i, span: b.span }))
          .sort((p, q) => q.span - p.span)
          .slice(0, MAX_INK_PATHS)
          .map((p) => p.i)
      : bounds.map((_, i) => i);

  const inkable = n > MAX_INK_PATHS ? new Set(ranked) : null;

  const orderedTs = def.order(ranked.map((i) => bounds[i]), width, height);
  const tOf = new Map<number, number>();
  ranked.forEach((contourIndex, k) => tOf.set(contourIndex, orderedTs[k]));

  return bounds.map((b, i) => {
    const t = Math.max(0, Math.min(1, tOf.get(i) ?? 1));
    const delay = t * total * 0.82 + jitter(i) * jitterAmount;
    return {
      delay: Math.max(0, delay),
      dur: total * (0.2 + Math.min(1, b.span / maxDim) * 0.26),
      ink: inkable ? inkable.has(i) : true,
      mass: (inkable ? inkable.has(i) : true) && t <= 0.45
    };
  });
}
