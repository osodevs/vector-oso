import { onMount } from 'svelte';
import type { Point, ProcessedImageData, TraceOptions } from '../core/types';
import type { TraceStage, TraceResponse } from '../workers/traceProtocol';

export interface TraceWorkerOptions {
  onCalculated?: (contourCount: number) => void;
  onError?: (msg: string) => void;
}

function createWorker(): Worker {
  return new Worker(new URL('../workers/traceWorker.ts', import.meta.url), { type: 'module' });
}

export function useTraceWorker(options?: TraceWorkerOptions | ((msg: string) => void)) {
  const onError = typeof options === 'function' ? options : options?.onError;
  const onCalculated = typeof options === 'object' ? options?.onCalculated : undefined;

  let worker: Worker | null = null;
  let isProcessing = $state(false);
  let finishing = $state(false);
  let progress = $state(0);
  let stage = $state<TraceStage | null>(null);
  let contours = $state.raw<Point[][]>([]);
  let error = $state<string | null>(null);

  let jobId = 0;
  let activeJob = 0;

  function attach(w: Worker) {
    w.onmessage = (e: MessageEvent<TraceResponse>) => {
      const msg = e.data;
      if (msg.jobId !== activeJob) return;

      if (msg.type === 'progress') {
        progress = msg.progress;
        stage = msg.stage;
        return;
      }

      progress = 1;
      stage = null;

      if (msg.type === 'done') {
        finishing = true;

        let applied = false;
        const apply = () => {
          if (applied) return;
          applied = true;
          contours = msg.contours;
          error = null;
          finishing = false;
          isProcessing = false;
          onCalculated?.(contours.length);
        };
        requestAnimationFrame(apply);
        setTimeout(apply, 120);
        return;
      }

      isProcessing = false;
      finishing = false;
      error = msg.error;
      onError?.(msg.error);
      console.error('[TraceWorker]', msg.error);
    };

    w.onerror = (e: ErrorEvent) => {
      isProcessing = false;
      finishing = false;
      stage = null;
      error = e.message;
      onError?.(e.message);
      console.error('[TraceWorker Error]', e);
    };
  }

  onMount(() => {
    worker = createWorker();
    attach(worker);
    return () => {
      worker?.terminate();
      worker = null;
    };
  });

  function dispatchTrace(data: ProcessedImageData, threshold: number, traceOpts: TraceOptions) {
    if (!worker) return;

    if (isProcessing) {
      worker.terminate();
      worker = createWorker();
      attach(worker);
    }

    activeJob = ++jobId;
    isProcessing = true;
    finishing = false;
    progress = 0;
    stage = 'edges';

    const grayBuf = data.gray.buffer.slice(0);
    const maskBuf = data.mask.buffer.slice(0);

    worker.postMessage(
      {
        jobId: activeJob,
        gray: grayBuf,
        mask: maskBuf,
        width: data.width,
        height: data.height,
        threshold,
        edgeSmooth: traceOpts.edgeSmooth,
        simplifyTolerance: traceOpts.simplifyTolerance,
        mode: traceOpts.mode
      },
      [grayBuf, maskBuf]
    );
  }

  function clearContours() {
    contours = [];
    error = null;
    isProcessing = false;
    finishing = false;
    progress = 0;
    stage = null;
  }

  return {
    get isProcessing() { return isProcessing; },
    get finishing() { return finishing; },
    get progress() { return progress; },
    get stage() { return stage; },
    get contours() { return contours; },
    get error() { return error; },
    dispatchTrace,
    clearContours
  };
}
