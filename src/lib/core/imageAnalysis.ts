export type Projection = readonly [number, number, number];

export const LUMA: Projection = [0.2126, 0.7152, 0.0722];

export type IlluminationField = readonly [number, number, number, number, number, number];

export interface SourceProfile {
  usesChannelMix: boolean;
  projection: Projection;
  separationGain: number;
  bimodality: number;
  inkFraction: number;
  illumination: IlluminationField | null;
  usesIllumination: boolean;
  illuminationRange: number;
  otsuThreshold: number;
  levelStretch: number;
  sourceHistogram: Uint32Array;
}

export const MIN_SEPARATION_GAIN = 1.15;

export function measureThresholdGrain(
  gray: Uint8Array,
  width: number,
  height: number,
  threshold: number
): number {
  let saddles = 0;
  let boundary = 0;
  for (let y = 0; y < height - 1; y++) {
    const row = y * width;
    const next = row + width;
    for (let x = 0; x < width - 1; x++) {
      const a = gray[row + x] <= threshold ? 1 : 0;
      const b = gray[row + x + 1] <= threshold ? 1 : 0;
      const c = gray[next + x] <= threshold ? 1 : 0;
      const d = gray[next + x + 1] <= threshold ? 1 : 0;
      const sum = a + b + c + d;
      if (sum === 0 || sum === 4) continue;
      boundary++;
      if ((a && d && !b && !c) || (b && c && !a && !d)) saddles++;
    }
  }
  return boundary > 0 ? saddles / boundary : 0;
}
export const MIN_ILLUMINATION_RANGE = 25;

const ANALYSIS_MAX_EDGE = 512;

interface Sample {
  r: Float64Array;
  g: Float64Array;
  b: Float64Array;
  x: Float64Array;
  y: Float64Array;
  width: number;
  height: number;
}

function sampleImage(img: ImageData): Sample {
  const step = Math.max(1, Math.ceil(Math.max(img.width, img.height) / ANALYSIS_MAX_EDGE));
  const w = Math.max(1, Math.floor(img.width / step));
  const h = Math.max(1, Math.floor(img.height / step));
  const n = w * h;
  const s: Sample = {
    r: new Float64Array(n), g: new Float64Array(n), b: new Float64Array(n),
    x: new Float64Array(n), y: new Float64Array(n), width: w, height: h
  };
  const d = img.data;
  let k = 0;
  for (let sy = 0; sy < h; sy++) {
    for (let sx = 0; sx < w; sx++, k++) {
      const p = ((sy * step) * img.width + sx * step) * 4;
      s.r[k] = d[p];
      s.g[k] = d[p + 1];
      s.b[k] = d[p + 2];
      s.x[k] = sx / w - 0.5;
      s.y[k] = sy / h - 0.5;
    }
  }
  return s;
}

function otsuSplit(v: Float64Array): { threshold: number; between: number; total: number } {
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < v.length; i++) {
    if (v[i] < lo) lo = v[i];
    if (v[i] > hi) hi = v[i];
  }
  if (!(hi > lo)) return { threshold: lo, between: 0, total: 0 };

  const BINS = 256;
  const scale = (BINS - 1) / (hi - lo);
  const hist = new Float64Array(BINS);
  for (let i = 0; i < v.length; i++) hist[Math.round((v[i] - lo) * scale)]++;

  const total = v.length;
  let sum = 0;
  for (let i = 0; i < BINS; i++) sum += i * hist[i];

  let wB = 0, sumB = 0, best = -1, bestBin = 0;
  for (let t = 0; t < BINS; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += t * hist[t];
    const between = (wB * wF * ((sumB / wB) - ((sum - sumB) / wF)) ** 2) / (total * total);
    if (between > best) { best = between; bestBin = t; }
  }

  let mean = 0;
  for (let i = 0; i < v.length; i++) mean += v[i];
  mean /= total;
  let variance = 0;
  for (let i = 0; i < v.length; i++) variance += (v[i] - mean) ** 2;
  variance /= total;

  const binToValue = (hi - lo) / (BINS - 1);
  return { threshold: lo + bestBin * binToValue, between: best * binToValue * binToValue, total: variance };
}

function fisherRatio(v: Float64Array, ink: Uint8Array): number {
  let n0 = 0, n1 = 0, s0 = 0, s1 = 0;
  for (let i = 0; i < v.length; i++) {
    if (ink[i]) { n0++; s0 += v[i]; } else { n1++; s1 += v[i]; }
  }
  if (n0 < 8 || n1 < 8) return 0;
  const m0 = s0 / n0, m1 = s1 / n1;
  let v0 = 0, v1 = 0;
  for (let i = 0; i < v.length; i++) {
    if (ink[i]) v0 += (v[i] - m0) ** 2; else v1 += (v[i] - m1) ** 2;
  }
  return ((m0 - m1) ** 2) / (v0 / n0 + v1 / n1 + 1e-9);
}

function project(s: Sample, p: Projection, out: Float64Array): Float64Array {
  for (let i = 0; i < out.length; i++) out[i] = p[0] * s.r[i] + p[1] * s.g[i] + p[2] * s.b[i];
  return out;
}

function solve(a: number[][], b: number[]): number[] | null {
  const n = b.length;
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) pivot = row;
    }
    if (Math.abs(a[pivot][col]) < 1e-9) return null;
    [a[col], a[pivot]] = [a[pivot], a[col]];
    [b[col], b[pivot]] = [b[pivot], b[col]];
    for (let row = col + 1; row < n; row++) {
      const f = a[row][col] / a[col][col];
      for (let k = col; k < n; k++) a[row][k] -= f * a[col][k];
      b[row] -= f * b[col];
    }
  }
  const out = new Array(n).fill(0);
  for (let row = n - 1; row >= 0; row--) {
    let acc = b[row];
    for (let k = row + 1; k < n; k++) acc -= a[row][k] * out[k];
    out[row] = acc / a[row][row];
  }
  return out;
}

function basisInto(out: Float64Array, x: number, y: number): Float64Array {
  out[0] = 1;
  out[1] = x;
  out[2] = y;
  out[3] = x * x;
  out[4] = y * y;
  out[5] = x * y;
  return out;
}

function fitIllumination(s: Sample, v: Float64Array, ink: Uint8Array): IlluminationField | null {
  const A: number[][] = Array.from({ length: 6 }, () => new Array(6).fill(0));
  const rhs = new Array(6).fill(0);
  const f = new Float64Array(6);
  let used = 0;
  for (let i = 0; i < v.length; i++) {
    if (ink[i]) continue;
    used++;
    basisInto(f, s.x[i], s.y[i]);
    for (let a = 0; a < 6; a++) {
      rhs[a] += f[a] * v[i];
      for (let b = 0; b < 6; b++) A[a][b] += f[a] * f[b];
    }
  }
  if (used < 64) return null;
  const coef = solve(A, rhs);
  return coef ? (coef as unknown as IlluminationField) : null;
}

function evaluateField(field: IlluminationField, x: number, y: number): number {
  return field[0] + field[1] * x + field[2] * y
    + field[3] * x * x + field[4] * y * y + field[5] * x * y;
}

function fieldRange(field: IlluminationField): number {
  let lo = Infinity, hi = -Infinity;
  const STEPS = 32;
  for (let i = 0; i <= STEPS; i++) {
    const y = i / STEPS - 0.5;
    for (let j = 0; j <= STEPS; j++) {
      const z = evaluateField(field, j / STEPS - 0.5, y);
      if (z < lo) lo = z;
      if (z > hi) hi = z;
    }
  }
  return hi - lo;
}

export function measureStrokeWidth(
  gray: Uint8Array,
  width: number,
  height: number,
  threshold: number
): number {
  const runs: number[] = [];
  const rowStep = Math.max(1, Math.floor(height / 200));
  const colStep = Math.max(1, Math.floor(width / 200));

  for (let y = 0; y < height; y += rowStep) {
    const row = y * width;
    let run = 0;
    for (let x = 0; x < width; x++) {
      if (gray[row + x] <= threshold) run++;
      else if (run > 0) { runs.push(run); run = 0; }
    }
    if (run > 0) runs.push(run);
  }
  for (let x = 0; x < width; x += colStep) {
    let run = 0;
    for (let y = 0; y < height; y++) {
      if (gray[y * width + x] <= threshold) run++;
      else if (run > 0) { runs.push(run); run = 0; }
    }
    if (run > 0) runs.push(run);
  }

  if (runs.length === 0) return 1;
  runs.sort((a, b) => a - b);
  return Math.max(1, runs[Math.floor(runs.length * 0.4)]);
}

export function analyzeSource(img: ImageData): SourceProfile {
  const s = sampleImage(img);
  const n = s.width * s.height;

  const luma = project(s, LUMA, new Float64Array(n));
  const sourceHistogram = new Uint32Array(256);
  for (let i = 0; i < n; i++) {
    sourceHistogram[Math.max(0, Math.min(255, Math.round(luma[i])))]++;
  }
  const split = otsuSplit(luma);
  const ink = new Uint8Array(n);
  for (let i = 0; i < n; i++) ink[i] = luma[i] <= split.threshold ? 1 : 0;

  let projection: Projection = LUMA;
  const scratch = new Float64Array(n);
  for (let pass = 0; pass < 3; pass++) {
    let ni = 0, np = 0;
    let ir = 0, ig = 0, ib = 0, pr = 0, pg = 0, pb = 0;
    for (let i = 0; i < n; i++) {
      if (ink[i]) { ni++; ir += s.r[i]; ig += s.g[i]; ib += s.b[i]; }
      else { np++; pr += s.r[i]; pg += s.g[i]; pb += s.b[i]; }
    }
    if (ni < 8 || np < 8) break;
    const dr = pr / np - ir / ni, dg = pg / np - ig / ni, db = pb / np - ib / ni;
    const len = Math.hypot(dr, dg, db);
    if (len < 1e-6) break;
    projection = [dr / len, dg / len, db / len];
    project(s, projection, scratch);
    const t = otsuSplit(scratch).threshold;
    for (let i = 0; i < n; i++) ink[i] = scratch[i] <= t ? 1 : 0;
  }

  const projected = project(s, projection, scratch);
  const gainProjected = fisherRatio(projected, ink);
  const gainLuma = fisherRatio(luma, ink);
  const separationGain = gainLuma > 1e-9 ? gainProjected / gainLuma : 1;

  const field = fitIllumination(s, luma, ink);
  const illuminationRange = field ? fieldRange(field) : 0;

  let inkCount = 0;
  for (let i = 0; i < n; i++) inkCount += ink[i];

  const useProjection = separationGain >= MIN_SEPARATION_GAIN;
  const finalProjection = useProjection ? projection : LUMA;

  let fullLo = Infinity, fullHi = -Infinity;
  {
    const d = img.data;
    const [pr, pg, pb] = finalProjection;
    for (let i = 0, p = 0; i < img.width * img.height; i++, p += 4) {
      const v = pr * d[p] + pg * d[p + 1] + pb * d[p + 2];
      if (v < fullLo) fullLo = v;
      if (v > fullHi) fullHi = v;
    }
  }
  const levelStretch = 255 / (fullHi - fullLo || 1);

  const finalField = project(s, finalProjection, new Float64Array(n));
  const finalSplit = otsuSplit(finalField);
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < n; i++) {
    if (finalField[i] < lo) lo = finalField[i];
    if (finalField[i] > hi) hi = finalField[i];
  }
  const span = hi - lo || 1;

  return {
    usesChannelMix: useProjection,
    projection: finalProjection,
    separationGain,
    bimodality: split.total > 1e-9 ? Math.min(1, split.between / split.total) : 0,
    inkFraction: inkCount / n,
    illumination: field,
    usesIllumination: !!field && illuminationRange >= MIN_ILLUMINATION_RANGE,
    illuminationRange,
    otsuThreshold: Math.round(((finalSplit.threshold - lo) / span) * 255),
    sourceHistogram,
    levelStretch
  };
}

export function projectToGray(img: ImageData, projection: Projection): Uint8Array {
  const n = img.width * img.height;
  const out = new Uint8Array(n);
  const d = img.data;
  const raw = new Float64Array(n);

  let lo = Infinity, hi = -Infinity;
  for (let i = 0, p = 0; i < n; i++, p += 4) {
    const v = projection[0] * d[p] + projection[1] * d[p + 1] + projection[2] * d[p + 2];
    raw[i] = v;
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }

  const span = hi - lo || 1;
  for (let i = 0; i < n; i++) out[i] = Math.max(0, Math.min(255, Math.round(((raw[i] - lo) / span) * 255)));
  return out;
}

export function flattenIllumination(
  gray: Uint8Array,
  width: number,
  height: number,
  field: IlluminationField
): Uint8Array {
  const out = new Uint8Array(gray.length);
  const fMid = evaluateField(field, 0, 0);

  for (let y = 0, i = 0; y < height; y++) {
    const ny = y / height - 0.5;
    for (let x = 0; x < width; x++, i++) {
      const z = evaluateField(field, x / width - 0.5, ny);
      out[i] = Math.max(0, Math.min(255, Math.round(gray[i] - (z - fMid))));
    }
  }
  return out;
}
