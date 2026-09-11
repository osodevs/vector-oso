export interface Point {
  x: number;
  y: number;
}

export interface BezierNode {
  point: Point;
  tangent: Point;
  handle: number;
}

export type Contour = Point[];
export type BezierContour = BezierNode[];

export interface SourceField {
  width: number;
  height: number;
  gray: Uint8Array;
}

export interface PreprocessOptions {
  threshold: number;
  blur: number;
  minDetail: number;
  invert?: boolean;
}

export interface TraceOptions {
  mode: 'subpixel' | 'pixel';
  edgeSmooth: number;
  simplifyTolerance: number;
}

export type MaskTool = 'move' | 'brush' | 'lasso';

export type MaskAction = 'remove' | 'add' | 'auto';

export type LassoRegion = 'inside' | 'outside';

export interface MaskEditStroke {
  type: MaskTool;
  action: MaskAction;
  points: Point[];
  radius: number;
  region?: LassoRegion;
}

export interface ProcessedImageData {
  width: number;
  height: number;
  gray: Uint8Array;
  mask: Uint8Array;
  histogram: Uint32Array;
}
