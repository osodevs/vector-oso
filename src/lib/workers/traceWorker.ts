import { extractSubpixelContours, extractPixelContours } from '../core/marchingSquares';
import { smoothContour } from '../core/smooth';
import { simplifyContour } from '../core/simplify';
import { mmToPx } from '../core/outputScale';
import type { Contour } from '../core/types';
import type { TraceStage, TraceRequest, TraceResponse } from './traceProtocol';

const STAGE_WEIGHT: Record<TraceStage, readonly [start: number, span: number]> = {
  edges: [0.0, 0.2],
  joining: [0.2, 0.35],
  orienting: [0.55, 0.15],
  curves: [0.7, 0.3]
};

self.onmessage = (e: MessageEvent<TraceRequest>) => {
  const { jobId } = e.data;
  const post = (msg: TraceResponse) => self.postMessage(msg);

  let lastSent = -1;
  const report = (stage: TraceStage, within: number) => {
    const [start, span] = STAGE_WEIGHT[stage];
    const progress = start + span * Math.max(0, Math.min(1, within));
    const pct = Math.floor(progress * 100);
    if (pct === lastSent) return;
    lastSent = pct;
    post({ jobId, type: 'progress', stage, progress });
  };

  try {
    const {
      gray,
      mask,
      width,
      height,
      threshold,
      edgeSmooth = 2,
      simplifyTolerance = 0.2,
      mode = 'subpixel'
    } = e.data;

    const grayArr = new Uint8Array(gray);
    const maskArr = new Uint8Array(mask);

    report('edges', 0);
    const rawContours: Contour[] =
      mode === 'subpixel'
        ? extractSubpixelContours(grayArr, maskArr, width, height, threshold, report)
        : extractPixelContours(maskArr, width, height, report);

    const scale = Math.max(1, Math.max(width, height) / 1800);
    const rdpTolerance = mmToPx(Math.max(0, simplifyTolerance));

    const processedContours: Contour[] = [];
    const total = rawContours.length || 1;
    for (let i = 0; i < rawContours.length; i++) {
      const simplified = simplifyContour(
        smoothContour(rawContours[i], edgeSmooth, scale),
        rdpTolerance
      );
      if (simplified.length >= 4) processedContours.push(simplified);
      if ((i & 31) === 0) report('curves', i / total);
    }

    post({ jobId, type: 'done', contours: processedContours });
  } catch (err: any) {
    post({ jobId, type: 'error', error: err?.message || 'Contour extraction failed.' });
  }
};
