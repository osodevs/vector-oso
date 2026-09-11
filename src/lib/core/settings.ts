import type { PreprocessOptions, TraceOptions } from './types';
import type { SourceProfile } from './imageAnalysis';

export interface Picture {
  profile: SourceProfile;
  strokeWidthPx: number;
  otsuThreshold: number;

  softenRadius: number;
}

export type Origin = 'measured' | 'target' | 'user';

export const CUT_KEYS = ['threshold', 'blur', 'minDetail'] as const;
export const SHAPE_KEYS = ['mode', 'edgeSmooth', 'simplifyTolerance'] as const;

export type CutKey = (typeof CUT_KEYS)[number];
export type ShapeKey = (typeof SHAPE_KEYS)[number];
export type SettingKey = CutKey | ShapeKey;

export type Origins = Record<SettingKey, Origin>;

export interface Proposal {
  pre: Pick<PreprocessOptions, CutKey>;
  trace: Pick<TraceOptions, ShapeKey>;
}

export function detailSizeFor(strokeWidthPx: number): number {
  return Math.max(2, Math.min(4, Math.round(strokeWidthPx)));
}

const DEFAULT_SHAPE = { mode: 'subpixel', edgeSmooth: 2, simplifyTolerance: 0.2 } as const;

export function proposeFor(picture: Picture | null): Proposal {
  return {
    pre: {
      threshold: picture ? picture.otsuThreshold : 128,
      blur: picture ? picture.softenRadius : 0,
      minDetail: picture ? detailSizeFor(picture.strokeWidthPx) : 4
    },
    trace: { ...DEFAULT_SHAPE }
  };
}

export function allMeasured(): Origins {
  return {
    threshold: 'measured', blur: 'measured', minDetail: 'measured',
    mode: 'measured', edgeSmooth: 'measured', simplifyTolerance: 'measured'
  };
}

export function isFullyAuto(origins: Origins): boolean {
  return (Object.values(origins) as Origin[]).every((o) => o === 'measured');
}
