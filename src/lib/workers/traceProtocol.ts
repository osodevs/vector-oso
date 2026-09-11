export type TraceStage = 'edges' | 'joining' | 'orienting' | 'curves';

export interface TraceRequest {
  jobId: number;
  gray: ArrayBuffer;
  mask: ArrayBuffer;
  width: number;
  height: number;
  threshold: number;
  edgeSmooth: number;
  simplifyTolerance: number;
  mode: 'subpixel' | 'pixel';
}

export type TraceResponse =
  | { jobId: number; type: 'progress'; stage: TraceStage; progress: number }
  | { jobId: number; type: 'done'; contours: { x: number; y: number }[][] }
  | { jobId: number; type: 'error'; error: string };
