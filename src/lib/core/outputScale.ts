export interface OutputScale {
  dpi: number;
}

export const DEFAULT_SCALE: OutputScale = { dpi: 96 };

const PT_PER_INCH = 72;
const MM_PER_INCH = 25.4;

export const pxToPt = (scale: OutputScale = DEFAULT_SCALE): number => PT_PER_INCH / scale.dpi;

export const pxToMm = (scale: OutputScale = DEFAULT_SCALE): number => MM_PER_INCH / scale.dpi;

export const mmToPx = (mm: number, scale: OutputScale = DEFAULT_SCALE): number =>
  (mm * scale.dpi) / MM_PER_INCH;

export const dim = (n: number): string => Number(n.toFixed(3)).toString();
