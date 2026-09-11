import type { PreprocessOptions, ProcessedImageData, SourceField } from './types';
import { measureThresholdGrain } from './imageAnalysis';

export function preprocessImage(
  source: SourceField,
  options: PreprocessOptions
): ProcessedImageData {
  const { width, height, gray: field } = source;
  const pixelCount = width * height;
  const mask = new Uint8Array(pixelCount);

  const blurred = options.blur > 0 ? applyBoxBlur(field, width, height, options.blur) : field;

  const histogram = new Uint32Array(256);
  for (let p = 0; p < pixelCount; p++) histogram[blurred[p]]++;

  const targetThreshold = options.threshold;
  for (let i = 0; i < pixelCount; i++) {
    const isDark = blurred[i] <= targetThreshold;
    mask[i] = options.invert ? (isDark ? 0 : 1) : (isDark ? 1 : 0);
  }

  let cleanedMask: Uint8Array = mask;
  if (options.minDetail > 1) {
    cleanedMask = removeSmallDetail(
      cleanedMask,
      width,
      height,
      options.minDetail * options.minDetail
    );
  }

  return {
    width,
    height,
    gray: blurred,
    mask: cleanedMask,
    histogram
  };
}

export function chooseSoftenRadius(
  gray: Uint8Array,
  width: number,
  height: number,
  threshold: number,
  maxRadius = 3
): number {
  const TARGET = 0.01;
  if (measureThresholdGrain(gray, width, height, threshold) <= TARGET) return 0;
  for (let r = 1; r <= maxRadius; r++) {
    const softened = applyBoxBlur(gray, width, height, r);
    if (measureThresholdGrain(softened, width, height, threshold) <= TARGET) return r;
  }
  return maxRadius;
}

export function otsuOfField(gray: Uint8Array): number {
  const histogram = new Uint32Array(256);
  for (let i = 0; i < gray.length; i++) histogram[gray[i]]++;
  return calculateOtsu(histogram, gray.length);
}

export function calculateOtsu(histogram: Uint32Array, totalPixels: number): number {
  let sum = 0;
  for (let i = 0; i < 256; i++) {
    sum += i * histogram[i];
  }

  let sumB = 0;
  let weightB = 0;
  let maxVariance = 0;
  let threshold = 128;

  for (let t = 0; t < 256; t++) {
    weightB += histogram[t];
    if (weightB === 0) continue;

    const weightF = totalPixels - weightB;
    if (weightF === 0) break;

    sumB += t * histogram[t];
    const meanB = sumB / weightB;
    const meanF = (sum - sumB) / weightF;

    const varianceBetween = weightB * weightF * (meanB - meanF) * (meanB - meanF);
    if (varianceBetween > maxVariance) {
      maxVariance = varianceBetween;
      threshold = t;
    }
  }

  return threshold;
}

export function removeSmallDetail(
  mask: Uint8Array,
  width: number,
  height: number,
  minSize: number
): Uint8Array {
  if (minSize <= 1) return mask;
  const despeckled = sweepComponents(mask, width, height, minSize, 1);
  return sweepComponents(despeckled, width, height, minSize, 0);
}

function sweepComponents(
  mask: Uint8Array,
  width: number,
  height: number,
  minSize: number,
  value: 0 | 1
): Uint8Array {
  const result = mask.slice();
  const visited = new Uint8Array(mask.length);

  const queue = new Int32Array(mask.length);
  const diagonal = value === 1;
  const flipped = value === 1 ? 0 : 1;

  for (let seed = 0; seed < mask.length; seed++) {
    if (visited[seed] || mask[seed] !== value) continue;

    let head = 0;
    let tail = 0;
    queue[tail++] = seed;
    visited[seed] = 1;
    let touchesBorder = false;

    while (head < tail) {
      const curr = queue[head++];
      const cx = curr % width;
      const cy = (curr / width) | 0;

      if (cx === 0 || cy === 0 || cx === width - 1 || cy === height - 1) touchesBorder = true;

      const left = cx > 0;
      const right = cx < width - 1;
      const up = cy > 0;
      const down = cy < height - 1;

      let ni = 0;
      if (left) { ni = curr - 1; if (mask[ni] === value && !visited[ni]) { visited[ni] = 1; queue[tail++] = ni; } }
      if (right) { ni = curr + 1; if (mask[ni] === value && !visited[ni]) { visited[ni] = 1; queue[tail++] = ni; } }
      if (up) { ni = curr - width; if (mask[ni] === value && !visited[ni]) { visited[ni] = 1; queue[tail++] = ni; } }
      if (down) { ni = curr + width; if (mask[ni] === value && !visited[ni]) { visited[ni] = 1; queue[tail++] = ni; } }

      if (diagonal) {
        if (left && up) { ni = curr - width - 1; if (mask[ni] === value && !visited[ni]) { visited[ni] = 1; queue[tail++] = ni; } }
        if (right && up) { ni = curr - width + 1; if (mask[ni] === value && !visited[ni]) { visited[ni] = 1; queue[tail++] = ni; } }
        if (left && down) { ni = curr + width - 1; if (mask[ni] === value && !visited[ni]) { visited[ni] = 1; queue[tail++] = ni; } }
        if (right && down) { ni = curr + width + 1; if (mask[ni] === value && !visited[ni]) { visited[ni] = 1; queue[tail++] = ni; } }
      }
    }

    if (tail >= minSize) continue;
    if (value === 0 && touchesBorder) continue;

    for (let k = 0; k < tail; k++) result[queue[k]] = flipped;
  }

  return result;
}

function applyBoxBlur(src: Uint8Array, w: number, h: number, r: number): Uint8Array {
  const temp = new Uint8Array(src.length);
  const out = new Uint8Array(src.length);

  for (let y = 0; y < h; y++) {
    const row = y * w;
    let sum = 0;
    for (let x = 0; x <= Math.min(w - 1, r); x++) sum += src[row + x];
    for (let x = 0; x < w; x++) {
      const left = Math.max(0, x - r);
      const right = Math.min(w - 1, x + r);
      if (x > 0) {
        if (x - r - 1 >= 0) sum -= src[row + x - r - 1];
        if (x + r < w) sum += src[row + x + r];
      }
      temp[row + x] = Math.round(sum / (right - left + 1));
    }
  }

  for (let x = 0; x < w; x++) {
    let sum = 0;
    for (let y = 0; y <= Math.min(h - 1, r); y++) sum += temp[y * w + x];
    for (let y = 0; y < h; y++) {
      const top = Math.max(0, y - r);
      const bottom = Math.min(h - 1, y + r);
      if (y > 0) {
        if (y - r - 1 >= 0) sum -= temp[(y - r - 1) * w + x];
        if (y + r < h) sum += temp[(y + r) * w + x];
      }
      out[y * w + x] = Math.round(sum / (bottom - top + 1));
    }
  }

  return out;
}
