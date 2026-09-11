export type TraceDetail = 'auto' | 'full' | 'compact';

const CHOICE_STORAGE = 'vector-oso-trace-detail-v1';
const DEMOTED_STORAGE = 'vector-oso-trace-demoted-v1';

function readChoice(): TraceDetail {
  try {
    const raw = localStorage.getItem(CHOICE_STORAGE);
    return raw === 'full' || raw === 'compact' ? raw : 'auto';
  } catch {
    return 'auto';
  }
}

function readDemoted(): boolean {
  try {
    return localStorage.getItem(DEMOTED_STORAGE) === '1';
  } catch {
    return false;
  }
}

export const tracePreference = $state<{ detail: TraceDetail; demoted: boolean }>({
  detail: typeof localStorage === 'undefined' ? 'auto' : readChoice(),
  demoted: typeof localStorage === 'undefined' ? false : readDemoted()
});

export function setTraceDetail(detail: TraceDetail): void {
  tracePreference.detail = detail;
  try {
    if (detail === 'auto') localStorage.removeItem(CHOICE_STORAGE);
    else localStorage.setItem(CHOICE_STORAGE, detail);

    if (detail === 'full') {
      localStorage.removeItem(DEMOTED_STORAGE);
      tracePreference.demoted = false;
    }
  } catch {
  }
}

export function demoteAfterCrash(): void {
  tracePreference.demoted = true;
  try {
    localStorage.setItem(DEMOTED_STORAGE, '1');
  } catch {
  }
}
