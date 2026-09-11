<script lang="ts">
  import { onMount } from 'svelte';
  import type { Point, MaskEditStroke, BezierContour } from '../core/types';
  import type { Translations } from '../i18n';
  import { fitBezierCurves } from '../core/bezier';
  import { isPointInPolygon } from '../core/marchingSquares';
  import CanvasToolbar from './canvas/CanvasToolbar.svelte';
  import ZoomControls from './canvas/toolbar/ZoomControls.svelte';
  import CanvasStage from './canvas/CanvasStage.svelte';
  import CanvasStatusBar from './canvas/CanvasStatusBar.svelte';
  import type { TraceStage } from '../workers/traceProtocol';
  import CanvasDropzone from './canvas/CanvasDropzone.svelte';
  import {
    calculateClampedPan,
    calculateFitToScreen,
    zoomAtPoint,
    clampZoom,
    ZOOM_STEP
  } from '../core/canvasViewport';
  import {
    renderScreenSpaceNodes,
    NODE_MIN_ZOOM,
    NODE_DETAIL_BUDGET,
    computeBezierBounds,
    calculateContourArea,
    bezierToPathString
  } from '../canvas/nodeOverlays';
  import type { NodeRenderStats } from '../canvas/nodeOverlays';
  import { createPinchTracker } from '../core/pinchGesture';
  import {
    getCanvasImageCoords,
    strokePointsToSvgPath
  } from '../canvas/maskDrawing';
  import { computeViewWindow, backingSize } from '../canvas/viewWindow';
  import {
    REVEAL_SECONDS,
    computeRevealTimings,
    resolveRevealStyle
  } from '../core/revealChoreography';
  import type { RevealStyle } from '../core/revealChoreography';
  import { revealPreference } from '../core/revealPreference.svelte';

  interface Props {
    t: Translations['canvas'];

    originalImage: HTMLCanvasElement | null;

    imageSerial: number;
    mask: Uint8Array | null;
    width: number;
    height: number;
    contours: Point[][];
    smoothFactor: number;
    isTracing: boolean;
    traceProgress?: number;
    traceFinishing?: boolean;
    traceStage?: TraceStage | null;
    onReduceDetail?: () => void;
    canUndoMask: boolean;
    canRedoMask: boolean;
    hasMaskEdits: boolean;
    viewMode?: 'original' | 'mask' | 'overlay' | 'vector';
    onApplyMaskEdit: (stroke: MaskEditStroke) => void;
    onUndoMask: () => void;
    onRedoMask: () => void;
    onResetMaskEdits: () => void;
    onFileSelected: (file: File) => void;
  }

  let {
    t,
    originalImage,
    imageSerial,
    mask,
    width,
    height,
    contours,
    smoothFactor,
    isTracing,
    traceProgress = 0,
    traceFinishing = false,
    traceStage = null,
    onReduceDetail,
    canUndoMask,
    canRedoMask,
    hasMaskEdits,
    viewMode = $bindable<'original' | 'mask' | 'overlay' | 'vector'>('vector'),
    onApplyMaskEdit,
    onUndoMask,
    onRedoMask,
    onResetMaskEdits,
    onFileSelected
  }: Props = $props();

  let originalColorMode = $state<'color' | 'grayscale'>('color');
  let maskDisplayMode = $state<'bright' | 'dark' | 'overlay' | 'overlay-pink' | 'overlay-amber' | 'overlay-red'>('bright');
  let overlayColorMode = $state<'blue' | 'amber' | 'pink' | 'black'>('blue');
  let overlayBase = $state<'original' | 'mask-bright' | 'mask-dark'>('original');
  let maskTool = $state<'move' | 'brush' | 'lasso'>('move');
  let maskAction = $state<'remove' | 'add' | 'auto'>('remove');
  let lassoRegion = $state<'inside' | 'outside'>('inside');
  let brushRadius = $state<number>(14);

  let vectorTool = $state<'move' | 'select'>('select');
  let canvasBg = $state<'grid' | 'white' | 'dark'>('grid');
  let nodesMode = $state<'selected' | 'all' | 'off'>('selected');

  let zoomLevel = $state<number>(100);
  let panX = $state<number>(0);
  let panY = $state<number>(0);
  let isPanning = $state<boolean>(false);
  let isMouseDown = false;
  let startX = 0;
  let startY = 0;
  let mouseDownClientX = 0;
  let mouseDownClientY = 0;

  const pinch = createPinchTracker();
  let suppressClick = false;

  let isDrawingMask = false;
  let activeStrokePoints = $state.raw<Point[]>([]);

  let cursorX = $state<number>(-100);
  let cursorY = $state<number>(-100);
  let isCursorInside = $state<boolean>(false);

  let hoveredContourIdx: number | null = null;
  let debouncedHoveredIdx = $state<number | null>(null);
  let selectedIndices = $state<number[]>([]);
  let hoverTimer: ReturnType<typeof setTimeout> | null = null;

  let baseCanvasEl = $state<HTMLCanvasElement>();
  let maskCanvasEl = $state<HTMLCanvasElement>();
  let nodeCanvasEl = $state<HTMLCanvasElement>();
  let canvasWrapEl = $state<HTMLElement>();
  let fileInputEl = $state<HTMLInputElement>();
  let isSpaceHeld = $state<boolean>(false);

  let cachedWrapRect: DOMRect | null = null;
  function getWrapRect(): DOMRect | null {
    if (!canvasWrapEl) return null;
    if (!cachedWrapRect) cachedWrapRect = canvasWrapEl.getBoundingClientRect();
    return cachedWrapRect;
  }
  function invalidateWrapRect() {
    cachedWrapRect = null;
  }

  let wrapWidth = $state<number>(0);
  let wrapHeight = $state<number>(0);

  $effect(() => {
    const el = canvasWrapEl;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      invalidateWrapRect();
      const box = entries[0]?.contentRect;
      if (box) {
        wrapWidth = box.width;
        wrapHeight = box.height;
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  });

  let viewWindow = $derived(
    computeViewWindow({ width, height, panX, panY, zoomLevel, wrapWidth, wrapHeight })
  );

  const scratchCanvases: Record<'raster' | 'mask', HTMLCanvasElement | null> = {
    raster: null,
    mask: null
  };
  function scratch(
    which: 'raster' | 'mask',
    w: number,
    h: number
  ): CanvasRenderingContext2D | null {
    let el = scratchCanvases[which];
    if (!el) {
      el = document.createElement('canvas');
      scratchCanvases[which] = el;
    }
    if (el.width !== w) el.width = w;
    if (el.height !== h) el.height = h;
    return el.getContext('2d', { willReadFrequently: true });
  }

  let gestureActive = $state(false);
  let gestureScale = 1;

  $effect(() => {
    const el = canvasWrapEl;
    if (!el) return;

    const onGesture = (ev: Event) => {
      if (!originalImage) return;
      ev.preventDefault();
      const e = ev as Event & { scale?: number; clientX?: number; clientY?: number };

      if (ev.type === 'gesturestart') {
        gestureScale = e.scale ?? 1;
        gestureActive = true;
        return;
      }
      if (ev.type === 'gestureend') {
        gestureActive = false;
        return;
      }

      if (pinch.count >= 2) return;

      const scale = e.scale ?? 1;
      if (!gestureScale || !scale) return;
      const ratio = scale / gestureScale;
      gestureScale = scale;
      if (ratio > 0 && ratio !== 1) {
        skipReveal();
        applyZoom(zoomLevel * ratio, { x: e.clientX ?? 0, y: e.clientY ?? 0 });
      }
    };

    el.addEventListener('gesturestart', onGesture, { passive: false });
    el.addEventListener('gesturechange', onGesture, { passive: false });
    el.addEventListener('gestureend', onGesture, { passive: false });
    return () => {
      el.removeEventListener('gesturestart', onGesture);
      el.removeEventListener('gesturechange', onGesture);
      el.removeEventListener('gestureend', onGesture);
    };
  });

  let viewportBusy = $state(false);
  let viewportSettleTimer: ReturnType<typeof setTimeout> | null = null;

  $effect(() => {
    void zoomLevel;
    void panX;
    void panY;
    viewportBusy = true;
    if (viewportSettleTimer) clearTimeout(viewportSettleTimer);
    viewportSettleTimer = setTimeout(() => { viewportBusy = false; }, 160);
    return () => {
      if (viewportSettleTimer) clearTimeout(viewportSettleTimer);
    };
  });

  let revealKey = $state<number>(0);
  let revealArmed = false;
  let lastRevealedSerial = -1;
  let revealPending = $state<boolean>(false);
  let activeRevealStyle = $state<RevealStyle>('sweep');

  $effect(() => {
    if (imageSerial !== lastRevealedSerial) {
      lastRevealedSerial = imageSerial;
      revealArmed = !!originalImage;
      revealPending = !!originalImage;
    }
  });

  $effect(() => {
    const tracing = isTracing;
    const traced = contours.length > 0;
    if (revealArmed && !tracing) {
      revealArmed = false;
      revealPending = false;
      if (traced) {
        const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!reduced && !revealTooHeavy()) {
          activeRevealStyle = resolveRevealStyle(revealPreference.style, activeRevealStyle);
          revealKey++;
        }
      }
    }
  });

  const REVEAL_CONTOUR_LIMIT = 1200;
  const REVEAL_CHAR_LIMIT = 400_000;

  function revealTooHeavy(): boolean {
    if (contours.length > REVEAL_CONTOUR_LIMIT) return true;
    let chars = 0;
    for (const d of individualPathStrings) {
      chars += d.length;
      if (chars > REVEAL_CHAR_LIMIT) return true;
    }
    return false;
  }

  function skipReveal() {
    if (revealKey > 0) revealKey = 0;
    if (revealPending) revealPending = false;
  }

  $effect(() => {
    if (vectorTool === 'move') {
      if (selectedIndices.length > 0) selectedIndices = [];
      if (debouncedHoveredIdx !== null) {
        hoveredContourIdx = null;
        debouncedHoveredIdx = null;
      }
    }
  });

  function setHoveredContour(idx: number | null) {
    if (idx === hoveredContourIdx) return;
    hoveredContourIdx = idx;
    if (hoverTimer) clearTimeout(hoverTimer);
    if (idx === null) {
      hoverTimer = setTimeout(() => { debouncedHoveredIdx = null; }, 120);
    } else {
      debouncedHoveredIdx = idx;
    }
  }

  function toggleNodesMode() {
    if (nodesMode === 'selected') nodesMode = 'all';
    else if (nodesMode === 'all') nodesMode = 'off';
    else nodesMode = 'selected';
  }

  function toggleOriginalMode() {
    if (viewMode !== 'original') viewMode = 'original';
    else originalColorMode = originalColorMode === 'color' ? 'grayscale' : 'color';
  }

  function toggleMaskMode() {
    if (viewMode !== 'mask') {
      viewMode = 'mask';
    } else {
      const maskModes = ['bright', 'dark', 'overlay', 'overlay-pink', 'overlay-amber', 'overlay-red'] as const;
      const nextMaskIdx = (maskModes.indexOf(maskDisplayMode) + 1) % maskModes.length;
      maskDisplayMode = maskModes[nextMaskIdx];
    }
  }

  function toggleOverlayMode() {
    if (viewMode !== 'overlay') {
      viewMode = 'overlay';
    } else {
      const modes = ['blue', 'amber', 'pink', 'black'] as const;
      const nextIdx = (modes.indexOf(overlayColorMode) + 1) % modes.length;
      overlayColorMode = modes[nextIdx];
    }
  }

  function toggleOverlayBase() {
    if (viewMode !== 'overlay') {
      viewMode = 'overlay';
      return;
    }
    const bases = ['original', 'mask-bright', 'mask-dark'] as const;
    overlayBase = bases[(bases.indexOf(overlayBase) + 1) % bases.length];
  }

  function toggleVectorMode() {
    if (viewMode !== 'vector') {
      viewMode = 'vector';
    } else {
      const bgModes = ['grid', 'white', 'dark'] as const;
      const nextBgIdx = (bgModes.indexOf(canvasBg) + 1) % bgModes.length;
      canvasBg = bgModes[nextBgIdx];
    }
  }

  onMount(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
      skipReveal();

      if (e.key === ' ') {
        e.preventDefault();
        isSpaceHeld = true;
        return;
      }

      if (e.metaKey || e.ctrlKey) {
        if (e.key === '0') { e.preventDefault(); fitToScreen(); return; }
        if (e.key === '1') { e.preventDefault(); applyZoom(100); return; }
        if (e.key === '=' || e.key === '+') { e.preventDefault(); handleZoomIn(); return; }
        if (e.key === '-' || e.key === '_') { e.preventDefault(); handleZoomOut(); return; }
      }

      if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        if (viewMode === 'original') toggleOriginalMode();
        else if (viewMode === 'mask') toggleMaskMode();
        else if (viewMode === 'overlay') toggleOverlayMode();
        else if (viewMode === 'vector') toggleVectorMode();
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        const views = ['original', 'mask', 'overlay', 'vector'] as const;
        const currentIdx = views.indexOf(viewMode || 'vector');
        const nextIdx = e.shiftKey
          ? (currentIdx - 1 + views.length) % views.length
          : (currentIdx + 1) % views.length;
        viewMode = views[nextIdx];
        return;
      }

      if (e.key === 'Escape') {
        if (selectedIndices.length > 0) {
          e.preventDefault();
          selectedIndices = [];
          debouncedHoveredIdx = null;
          hoveredContourIdx = null;
          return;
        }
      }

      if ((e.metaKey || e.ctrlKey) && (e.key === 'd' || e.key === 'D')) {
        if (selectedIndices.length > 0) {
          e.preventDefault();
          selectedIndices = [];
          debouncedHoveredIdx = null;
          hoveredContourIdx = null;
          return;
        }
      }

      if (e.key === '1') { e.preventDefault(); toggleOriginalMode(); return; }
      if (e.key === '2') { e.preventDefault(); toggleMaskMode(); return; }
      if (e.key === '3') { e.preventDefault(); toggleOverlayMode(); return; }
      if (e.key === 'w' || e.key === 'W') { e.preventDefault(); toggleOverlayBase(); return; }
      if (e.key === '4') { e.preventDefault(); toggleVectorMode(); return; }

      if (e.key === '0' || e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        fitToScreen();
        return;
      }

      if (e.key === 'v' || e.key === 'V' || e.key === 's' || e.key === 'S') {
        if (viewMode === 'vector' || viewMode === 'overlay') {
          e.preventDefault();
          vectorTool = 'select';
        } else if (viewMode === 'mask') {
          e.preventDefault();
          maskTool = 'move';
        }
        return;
      }

      if (e.key === 'o' || e.key === 'O') {
        if (viewMode === 'mask' && maskTool === 'lasso') {
          e.preventDefault();
          lassoRegion = lassoRegion === 'inside' ? 'outside' : 'inside';
        }
        return;
      }

      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        if (viewMode === 'mask') maskTool = 'move';
        else vectorTool = 'move';
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        if (viewMode === 'vector' || viewMode === 'overlay') {
          e.preventDefault();
          toggleNodesMode();
        }
        return;
      }

      if (e.key === 'b' || e.key === 'B') {
        if (viewMode === 'mask') { e.preventDefault(); maskTool = 'brush'; }
        return;
      }
      if (e.key === 'l' || e.key === 'L') {
        if (viewMode === 'mask') { e.preventDefault(); maskTool = 'lasso'; }
        return;
      }
      if (e.key === 'x' || e.key === 'X') {
        if (viewMode === 'mask') {
          e.preventDefault();
          if (maskAction === 'remove') maskAction = 'add';
          else if (maskAction === 'add') maskAction = 'auto';
          else maskAction = 'remove';
        }
        return;
      }

      if (e.key === '[' || e.key === ',') {
        if (viewMode === 'mask') {
          e.preventDefault();
          brushRadius = Math.max(1, brushRadius - 3);
        }
        return;
      }
      if (e.key === ']' || e.key === '.') {
        if (viewMode === 'mask') {
          e.preventDefault();
          brushRadius = Math.min(60, brushRadius + 3);
        }
        return;
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (e.key === ' ') isSpaceHeld = false;
    }

    function handleResize() {
      invalidateWrapRect();
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, { passive: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize);
      if (nodeFrame) cancelAnimationFrame(nodeFrame);
    };
  });

  export function fitToScreen() {
    const rect = getWrapRect();
    if (!rect || width === 0 || height === 0) return;
    const res = calculateFitToScreen(width, height, rect.width, rect.height);
    zoomLevel = res.zoomLevel;
    panX = res.panX;
    panY = res.panY;
  }

  $effect(() => {
    if (originalImage && width > 0 && height > 0) {
      fitToScreen();
    }
  });

  function applyZoom(newZoom: number, anchor?: Point) {
    const rect = getWrapRect();
    if (!rect) return;
    const cursor = anchor || { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    const res = zoomAtPoint(
      newZoom,
      cursor.x - rect.left,
      cursor.y - rect.top,
      { zoomLevel, panX, panY },
      width,
      height,
      rect.width,
      rect.height
    );
    zoomLevel = res.zoomLevel;
    panX = res.panX;
    panY = res.panY;
  }

  function handleZoomIn() { applyZoom(zoomLevel + ZOOM_STEP); }
  function handleZoomOut() { applyZoom(zoomLevel - ZOOM_STEP); }
  function handleResetZoom() { zoomLevel = 100; panX = 0; panY = 0; }

  function toGrayscale(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      d[i] = gray;
      d[i + 1] = gray;
      d[i + 2] = gray;
    }
    ctx.putImageData(imgData, 0, 0);
  }

  $effect(() => {
    if (!baseCanvasEl || width === 0 || height === 0 || !originalImage) return;
    const win = viewWindow;
    const grayscale = viewMode === 'original' && originalColorMode === 'grayscale';

    if (!win) {
      if (baseCanvasEl.width !== width) baseCanvasEl.width = width;
      if (baseCanvasEl.height !== height) baseCanvasEl.height = height;
      const ctx = baseCanvasEl.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(originalImage, 0, 0, width, height);
      if (grayscale) toGrayscale(ctx, width, height);
      return;
    }

    const zoom = zoomLevel / 100;
    const dst = backingSize(win.w, win.h, zoom, window.devicePixelRatio || 1);
    if (baseCanvasEl.width !== dst.width) baseCanvasEl.width = dst.width;
    if (baseCanvasEl.height !== dst.height) baseCanvasEl.height = dst.height;
    const ctx = baseCanvasEl.getContext('2d');
    if (!ctx) return;

    let source: CanvasImageSource = originalImage;
    let sx = win.x, sy = win.y, sw = win.w, sh = win.h;
    if (grayscale) {
      const small = scratch('raster', win.w, win.h);
      if (!small) return;
      small.clearRect(0, 0, win.w, win.h);
      small.drawImage(originalImage, win.x, win.y, win.w, win.h, 0, 0, win.w, win.h);
      toGrayscale(small, win.w, win.h);
      source = small.canvas;
      sx = 0; sy = 0;
    }

    ctx.clearRect(0, 0, dst.width, dst.height);
    ctx.imageSmoothingEnabled = zoom < 1;
    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, dst.width, dst.height);
  });

  let maskPaintMode = $derived.by(() => {
    if (viewMode === 'mask') return maskDisplayMode;
    if (viewMode === 'overlay' && overlayBase === 'mask-bright') return 'bright' as const;
    if (viewMode === 'overlay' && overlayBase === 'mask-dark') return 'dark' as const;
    return null;
  });

  $effect(() => {
    if (!maskCanvasEl || width === 0 || height === 0 || !mask) return;

    if (!maskPaintMode) {
      if (maskCanvasEl.width !== 0) maskCanvasEl.width = 0;
      if (maskCanvasEl.height !== 0) maskCanvasEl.height = 0;
      return;
    }

    const win = viewWindow;
    const winX = win ? win.x : 0;
    const winY = win ? win.y : 0;
    const winW = win ? win.w : width;
    const winH = win ? win.h : height;

    const paintCtx = win ? scratch('mask', winW, winH) : maskCanvasEl.getContext('2d');
    if (!paintCtx) return;

    const imgData = paintCtx.createImageData(winW, winH);
    const out = imgData.data;
    const bright = maskPaintMode === 'bright';
    const dark = maskPaintMode === 'dark';
    let r = 29, g = 78, b = 216, a = 145;
    if (maskPaintMode === 'overlay-pink') { r = 236; g = 72; b = 153; a = 155; }
    else if (maskPaintMode === 'overlay-amber') { r = 245; g = 158; b = 11; a = 155; }
    else if (maskPaintMode === 'overlay-red') { r = 239; g = 68; b = 68; a = 155; }

    for (let row = 0; row < winH; row++) {
      let src = (winY + row) * width + winX;
      let p = row * winW * 4;
      for (let col = 0; col < winW; col++, src++, p += 4) {
        const on = mask[src];
        if (bright) {
          const val = on ? 0 : 255;
          out[p] = val; out[p + 1] = val; out[p + 2] = val; out[p + 3] = 255;
        } else if (dark) {
          if (on) { out[p] = 255; out[p + 1] = 255; out[p + 2] = 255; out[p + 3] = 255; }
          else { out[p] = 18; out[p + 1] = 19; out[p + 2] = 27; out[p + 3] = 255; }
        } else if (on) {
          out[p] = r; out[p + 1] = g; out[p + 2] = b; out[p + 3] = a;
        }
      }
    }

    if (!win) {
      if (maskCanvasEl.width !== width) maskCanvasEl.width = width;
      if (maskCanvasEl.height !== height) maskCanvasEl.height = height;
      const ctx = maskCanvasEl.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      ctx.putImageData(imgData, 0, 0);
      return;
    }

    paintCtx.putImageData(imgData, 0, 0);
    const zoom = zoomLevel / 100;
    const dst = backingSize(winW, winH, zoom, window.devicePixelRatio || 1);
    if (maskCanvasEl.width !== dst.width) maskCanvasEl.width = dst.width;
    if (maskCanvasEl.height !== dst.height) maskCanvasEl.height = dst.height;
    const ctx = maskCanvasEl.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, dst.width, dst.height);
    ctx.imageSmoothingEnabled = zoom < 1;
    ctx.drawImage(paintCtx.canvas, 0, 0, winW, winH, 0, 0, dst.width, dst.height);
  });

  let vectorVisible = $derived(viewMode === 'vector' || viewMode === 'overlay');

  let invScale = $derived(1 / Math.max(0.1, zoomLevel / 100));

  let bezierContourList = $derived(
    contours.map((c) => fitBezierCurves(c, smoothFactor))
  );

  let totalNodeCount = $derived.by(() => {
    let n = 0;
    for (const c of contours) {
      if (!c || c.length < 3) continue;
      const dup =
        c.length > 3 &&
        c[0].x === c[c.length - 1].x &&
        c[0].y === c[c.length - 1].y;
      const len = dup ? c.length - 1 : c.length;
      if (len >= 3) n += len;
    }
    return n;
  });

  const HEAVY_SHAPE_COUNT = 2500;
  const HEAVY_NODE_COUNT = 50000;

  let perfDismissed = $state(false);
  let perfExpanded = $state(false);

  let isHeavyResult = $derived(
    !isTracing && (contours.length > HEAVY_SHAPE_COUNT || totalNodeCount > HEAVY_NODE_COUNT)
  );

  $effect(() => {
    if (!isHeavyResult) {
      perfDismissed = false;
      perfExpanded = false;
    }
  });

  let individualPathStrings = $derived(
    bezierContourList.map((b) => bezierToPathString(b))
  );

  let combinedSvgPath = $derived(
    individualPathStrings.filter(Boolean).join(' ')
  );

  const CULL_FROM_ZOOM = 150;

  function cullToViewport(): string {
    const rect = getWrapRect();
    if (!rect || zoomLevel <= CULL_FROM_ZOOM) {
      return individualPathStrings.filter(Boolean).join(' ');
    }
    const a = getCanvasImageCoords(rect.left, rect.top, rect, panX, panY, zoomLevel, width, height, false);
    const b = getCanvasImageCoords(rect.right, rect.bottom, rect, panX, panY, zoomLevel, width, height, false);
    const mx = Math.abs(b.x - a.x), my = Math.abs(b.y - a.y);
    const x0 = Math.min(a.x, b.x) - mx, x1 = Math.max(a.x, b.x) + mx;
    const y0 = Math.min(a.y, b.y) - my, y1 = Math.max(a.y, b.y) + my;

    const pieces: string[] = [];
    for (let i = 0; i < hitShapes.length; i++) {
      const s = hitShapes[i];
      if (!s || s.maxX < x0 || s.minX > x1 || s.maxY < y0 || s.minY > y1) continue;
      const p = individualPathStrings[i];
      if (p) pieces.push(p);
    }
    return pieces.join(' ');
  }

  let culledSvgPath = $state('');
  $effect(() => {
    if (!vectorVisible) return;
    void combinedSvgPath;
    void zoomLevel;
    void panX;
    void panY;
    if (viewportBusy) return;
    culledSvgPath = cullToViewport();
  });

  let vectorFillColor = $derived(canvasBg === 'dark' ? '#ffffff' : '#000000');

  interface HitShape {
    minX: number; minY: number; maxX: number; maxY: number; area: number; poly: Point[];
  }

  let hitShapes = $derived.by<HitShape[]>(() =>
    contours.map((c) => {
      if (!c || c.length < 3) return { minX: 0, minY: 0, maxX: -1, maxY: -1, area: 0, poly: [] };
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (let i = 0; i < c.length; i++) {
        const q = c[i];
        if (q.x < minX) minX = q.x; if (q.x > maxX) maxX = q.x;
        if (q.y < minY) minY = q.y; if (q.y > maxY) maxY = q.y;
      }
      return {
        minX, minY, maxX, maxY,
        area: (maxX - minX) * (maxY - minY),
        poly: c
      };
    })
  );

  const HOVER_GRAB_PX = 4;

  function distSqToSegment(p: Point, a: Point, b: Point): number {
    const vx = b.x - a.x;
    const vy = b.y - a.y;
    const wx = p.x - a.x;
    const wy = p.y - a.y;
    const len = vx * vx + vy * vy;
    let t = len > 0 ? (wx * vx + wy * vy) / len : 0;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const dx = wx - t * vx;
    const dy = wy - t * vy;
    return dx * dx + dy * dy;
  }

  function hitTestContour(e: MouseEvent): number | null {
    if (viewMode !== 'vector' && viewMode !== 'overlay') return null;
    const rect = getWrapRect();
    if (!rect) return null;
    const pt = getCanvasImageCoords(
      e.clientX, e.clientY, rect, panX, panY, zoomLevel, width, height, false
    );
    const inside = hitTestInside(pt);
    return inside !== null ? inside : hitTestNearOutline(pt);
  }

  function hitTestInside(pt: Point): number | null {
    let best: number | null = null;
    let bestArea = Infinity;
    for (let i = 0; i < hitShapes.length; i++) {
      const h = hitShapes[i];
      if (pt.x < h.minX || pt.x > h.maxX || pt.y < h.minY || pt.y > h.maxY) continue;
      if (h.poly.length < 3 || !isPointInPolygon(pt, h.poly)) continue;
      if (h.area < bestArea) {
        bestArea = h.area;
        best = i;
      }
    }
    return best;
  }

  function hitTestNearOutline(pt: Point): number | null {
    const margin = HOVER_GRAB_PX * invScale;
    const marginSq = margin * margin;
    let best: number | null = null;
    let bestDist = Infinity;

    for (let i = 0; i < hitShapes.length; i++) {
      const h = hitShapes[i];
      if (
        pt.x < h.minX - margin || pt.x > h.maxX + margin ||
        pt.y < h.minY - margin || pt.y > h.maxY + margin
      ) continue;
      const poly = h.poly;
      if (poly.length < 2) continue;
      for (let k = 0; k < poly.length - 1; k++) {
        const d = distSqToSegment(pt, poly[k], poly[k + 1]);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      }
    }
    return bestDist <= marginSq ? best : null;
  }

  let descendantsCache = new Map<number, number[]>();

  $effect(() => {
    void hitShapes;
    descendantsCache = new Map();
  });

  function buildYIndex(poly: Point[]) {
    let minY = Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < poly.length; i++) {
      if (poly[i].y < minY) minY = poly[i].y;
      if (poly[i].y > maxY) maxY = poly[i].y;
    }
    const span = maxY - minY || 1;
    const buckets = Math.max(8, Math.min(256, Math.round(poly.length / 24)));
    const rows: number[][] = Array.from({ length: buckets }, () => []);
    const n = poly.length - 1;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const a = poly[i];
      const b = poly[j];
      const lo = Math.min(a.y, b.y);
      const hi = Math.max(a.y, b.y);
      const from = Math.max(0, Math.min(buckets - 1, Math.floor(((lo - minY) / span) * buckets)));
      const to = Math.max(0, Math.min(buckets - 1, Math.floor(((hi - minY) / span) * buckets)));
      for (let k = from; k <= to; k++) rows[k].push(i);
    }
    return { minY, span, buckets, rows, poly, n };
  }

  function insideYIndex(idx: ReturnType<typeof buildYIndex>, p: Point): boolean {
    const k = Math.max(
      0,
      Math.min(idx.buckets - 1, Math.floor(((p.y - idx.minY) / idx.span) * idx.buckets))
    );
    const list = idx.rows[k];
    const poly = idx.poly;
    let inside = false;
    for (let m = 0; m < list.length; m++) {
      const i = list[m];
      const j = (i - 1 + idx.n) % idx.n;
      const p1 = poly[i];
      const p2 = poly[j];
      if (
        p1.y > p.y !== p2.y > p.y &&
        p.x < ((p2.x - p1.x) * (p.y - p1.y)) / (p2.y - p1.y || 1e-12) + p1.x
      ) {
        inside = !inside;
      }
    }
    return inside;
  }

  function descendantsOf(i: number): number[] {
    const cached = descendantsCache.get(i);
    if (cached) return cached;

    const found: number[] = [];
    const outer = hitShapes[i];
    if (outer && outer.poly.length >= 3) {
      const idx = buildYIndex(outer.poly);
      for (let j = 0; j < hitShapes.length; j++) {
        if (i === j) continue;
        const inner = hitShapes[j];
        if (!inner || inner.poly.length < 3) continue;
        if (
          inner.minX >= outer.minX && inner.maxX <= outer.maxX &&
          inner.minY >= outer.minY && inner.maxY <= outer.maxY &&
          insideYIndex(idx, inner.poly[0])
        ) {
          found.push(j);
        }
      }
    }
    descendantsCache.set(i, found);
    return found;
  }

  function pathWithHoles(indices: number[]): string {
    const set = new Set<number>();
    for (const idx of indices) {
      set.add(idx);
      for (const desc of descendantsOf(idx)) set.add(desc);
    }
    const pieces: string[] = [];
    for (const i of set) {
      const p = individualPathStrings[i];
      if (p) pieces.push(p);
    }
    return pieces.join(' ');
  }

  let selectedContoursCombinedPath = $derived.by(() => {
    if (selectedIndices.length === 0) return '';
    return pathWithHoles(selectedIndices);
  });

  let selectedOutlinePath = $derived.by(() => {
    if (selectedIndices.length === 0) return '';
    return selectedIndices.map((i) => individualPathStrings[i]).filter(Boolean).join(' ');
  });

  let hoveredContourPath = $derived.by(() => {
    if (debouncedHoveredIdx === null || selectedIndices.includes(debouncedHoveredIdx)) return '';
    return pathWithHoles([debouncedHoveredIdx]);
  });

  let hoveredOutlinePath = $derived.by(() => {
    if (debouncedHoveredIdx === null || selectedIndices.includes(debouncedHoveredIdx)) return '';
    return individualPathStrings[debouncedHoveredIdx] ?? '';
  });

  let hoveredContourNodes = $derived(
    debouncedHoveredIdx !== null && bezierContourList[debouncedHoveredIdx] ? bezierContourList[debouncedHoveredIdx] : null
  );
  let hoveredContourNodesCount = $derived(hoveredContourNodes ? hoveredContourNodes.length : 0);
  let hoveredContourArea = $derived(calculateContourArea(hoveredContourNodes));

  let singleSelectedContourNodes = $derived(
    selectedIndices.length === 1 && bezierContourList[selectedIndices[0]] ? bezierContourList[selectedIndices[0]] : null
  );
  let singleSelectedNodesCount = $derived(singleSelectedContourNodes ? singleSelectedContourNodes.length : 0);
  let singleSelectedArea = $derived(calculateContourArea(singleSelectedContourNodes));

  let totalSelectedNodesCount = $derived.by(() =>
    selectedIndices.reduce((sum, idx) => {
      const b = bezierContourList[idx];
      return sum + (b ? b.length : 0);
    }, 0)
  );
  let totalSelectedArea = $derived.by(() =>
    selectedIndices.reduce((sum, idx) => sum + calculateContourArea(bezierContourList[idx]), 0)
  );

  let nodeTargets = $derived.by<number[]>(() => {
    if (nodesMode === 'off' || (viewMode !== 'vector' && viewMode !== 'overlay')) return [];
    if (nodesMode === 'all') return bezierContourList.map((_, i) => i);
    return selectedIndices;
  });

  let bezierBounds = $derived(vectorVisible ? computeBezierBounds(bezierContourList) : null);

  function drawNodeOverlay() {
    const cv = nodeCanvasEl;
    if (!cv || !canvasWrapEl) return;

    const rect = getWrapRect();
    if (!rect) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cw = Math.max(1, Math.round(rect.width));
    const ch = Math.max(1, Math.round(rect.height));
    if (cv.width !== cw * dpr || cv.height !== ch * dpr) {
      cv.width = cw * dpr;
      cv.height = ch * dpr;
    }
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);

    nodeRenderStats = renderScreenSpaceNodes({
      ctx,
      bezierContourList,
      bounds: bezierBounds,
      targets: nodeTargets,
      zoomLevel,
      panX,
      panY,
      imageWidth: width,
      imageHeight: height,
      containerWidth: cw,
      containerHeight: ch
    });
  }

  let nodeRenderStats = $state.raw<NodeRenderStats | null>(null);
  let nodeFrame = 0;

  $effect(() => {
    const cv = nodeCanvasEl;

    if (!vectorVisible) {
      if (nodeFrame) {
        cancelAnimationFrame(nodeFrame);
        nodeFrame = 0;
      }
      const ctx = cv?.getContext('2d');
      if (cv && ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, cv.width, cv.height);
      }
      nodeRenderStats = null;
      return;
    }

    void canvasWrapEl;
    void nodeTargets;
    void bezierContourList;
    void bezierBounds;
    void zoomLevel;
    void panX;
    void panY;
    void width;
    void height;
    void wrapWidth;
    void wrapHeight;

    if (!nodeCanvasEl || !canvasWrapEl) return;
    if (nodeFrame) return;
    nodeFrame = requestAnimationFrame(() => {
      nodeFrame = 0;
      drawNodeOverlay();
    });
  });

  let revealTimings = $derived(
    computeRevealTimings(contours, width, height, activeRevealStyle, REVEAL_SECONDS)
  );

  let carveMassPath = $derived.by(() => {
    if (activeRevealStyle !== 'carve') return '';
    return individualPathStrings.filter((_, i) => revealTimings[i]?.mass).join(' ');
  });

  let liveBrushPath = $derived(strokePointsToSvgPath(activeStrokePoints));

  let activeCursor = $derived.by(() => {
    if (!originalImage) return 'default';
    if (isPanning) return 'grabbing';
    if (isSpaceHeld) return 'grab';
    if (viewMode === 'mask') return maskTool === 'move' ? 'grab' : 'crosshair';
    if (viewMode === 'vector' || viewMode === 'overlay') return vectorTool === 'select' ? 'default' : 'grab';
    return 'grab';
  });

  function handleContourClick(e: MouseEvent, idx: number) {
    if (viewMode !== 'vector' && viewMode !== 'overlay') return;
    if (vectorTool !== 'select') return;

    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      if (selectedIndices.includes(idx)) {
        selectedIndices = selectedIndices.filter((i) => i !== idx);
      } else {
        selectedIndices = [...selectedIndices, idx];
      }
    } else {
      if (selectedIndices.length === 1 && selectedIndices[0] === idx) {
        selectedIndices = [];
      } else {
        selectedIndices = [idx];
      }
    }
  }

  function handleClearSelection() {
    selectedIndices = [];
    debouncedHoveredIdx = null;
    hoveredContourIdx = null;
  }

  function handleCanvasClick(e: MouseEvent) {
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    if (Math.abs(e.clientX - mouseDownClientX) > 4 || Math.abs(e.clientY - mouseDownClientY) > 4) return;
    if ((viewMode === 'vector' || viewMode === 'overlay') && vectorTool === 'select') {
      const idx = hitTestContour(e);
      if (idx !== null) {
        handleContourClick(e, idx);
        return;
      }
    }
    if (selectedIndices.length > 0) {
      selectedIndices = [];
      hoveredContourIdx = null;
    }
  }

  function handleWheel(e: WheelEvent) {
    if (!originalImage) return;
    if (gestureActive) {
      e.preventDefault();
      return;
    }
    skipReveal();

    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const clampedDelta = Math.max(-30, Math.min(30, e.deltaY));
      const zoomFactor = Math.exp(-clampedDelta * 0.008);
      const newZoom = Math.round(zoomLevel * zoomFactor);
      applyZoom(newZoom, { x: e.clientX, y: e.clientY });
      return;
    }

    const absX = Math.abs(e.deltaX);
    const absY = Math.abs(e.deltaY);

    const rect = getWrapRect();
    const cw = rect ? rect.width : 800;
    const ch = rect ? rect.height : 600;

    if (absX > absY) {
      e.preventDefault();
      const targetPanX = panX - e.deltaX;
      const res = calculateClampedPan(targetPanX, panY, zoomLevel, width, height, cw, ch);
      panX = res.x;
      return;
    }

    if (typeof window !== 'undefined' && window.scrollY > 0 && e.deltaY < 0) {
      window.scrollBy({ top: e.deltaY, behavior: 'auto' });
      return;
    }

    const targetPanY = panY - e.deltaY;
    const res = calculateClampedPan(panX, targetPanY, zoomLevel, width, height, cw, ch);

    if (res.y !== panY) {
      e.preventDefault();
      panY = res.y;
      if (absX > 0) {
        const targetPanX = panX - e.deltaX;
        const resX = calculateClampedPan(targetPanX, panY, zoomLevel, width, height, cw, ch);
        panX = resX.x;
      }
    } else {
      window.scrollBy({ top: e.deltaY, behavior: 'auto' });
    }
  }

  function handlePointerDown(e: PointerEvent) {
    if (!originalImage) return;
    skipReveal();

    pinch.down(e);
    if (pinch.active) {
      cancelSingleGesture();
      suppressClick = true;
      return;
    }

    try { canvasWrapEl?.setPointerCapture(e.pointerId); } catch {  }

    const vectorMovePans = (viewMode === 'vector' || viewMode === 'overlay') && vectorTool === 'move';

    if (e.button === 1 || isSpaceHeld || (viewMode === 'mask' && maskTool === 'move') || vectorMovePans) {
      isPanning = true;
      startX = e.clientX - panX;
      startY = e.clientY - panY;
      return;
    }

    if (viewMode === 'mask' && maskTool !== 'move') {
      isDrawingMask = true;
      const rect = getWrapRect();
      if (rect) {
        const pt = getCanvasImageCoords(e.clientX, e.clientY, rect, panX, panY, zoomLevel, width, height);
        activeStrokePoints = [pt];
      }
    } else {
      isMouseDown = true;
      mouseDownClientX = e.clientX;
      mouseDownClientY = e.clientY;
      startX = e.clientX - panX;
      startY = e.clientY - panY;
    }
  }

  function handlePointerMove(e: PointerEvent) {
    if (!originalImage) return;

    const gesture = pinch.move(e);
    if (gesture) {
      const next = zoomLevel * gesture.scale;
      applyZoom(next, { x: gesture.midX, y: gesture.midY });
      if (gesture.dx || gesture.dy) {
        const rect = getWrapRect();
        const res = calculateClampedPan(
          panX + gesture.dx,
          panY + gesture.dy,
          zoomLevel,
          width,
          height,
          rect ? rect.width : 800,
          rect ? rect.height : 600
        );
        panX = res.x;
        panY = res.y;
      }
      return;
    }
    if (pinch.active) return;

    cursorX = e.clientX;
    cursorY = e.clientY;

    if ((viewMode === 'vector' || viewMode === 'overlay') && vectorTool === 'select' && !isPanning) {
      setHoveredContour(hitTestContour(e));
    }

    if (isPanning || (isMouseDown && !isDrawingMask)) {
      const rect = getWrapRect();
      const cw = rect ? rect.width : 800;
      const ch = rect ? rect.height : 600;
      const targetPanX = e.clientX - startX;
      const targetPanY = e.clientY - startY;
      const res = calculateClampedPan(targetPanX, targetPanY, zoomLevel, width, height, cw, ch);
      panX = res.x;
      panY = res.y;
      return;
    }

    if (isDrawingMask && viewMode === 'mask') {
      const rect = getWrapRect();
      if (rect) {
        const pt = getCanvasImageCoords(e.clientX, e.clientY, rect, panX, panY, zoomLevel, width, height);
        activeStrokePoints = [...activeStrokePoints, pt];
      }
    }
  }

  function cancelSingleGesture() {
    isPanning = false;
    isMouseDown = false;
    isDrawingMask = false;
    activeStrokePoints = [];
  }

  function handlePointerUp(e?: PointerEvent) {
    if (e) {
      pinch.up(e);
      try { canvasWrapEl?.releasePointerCapture(e.pointerId); } catch {  }
      if (pinch.count > 0) return;
    }

    isPanning = false;
    isMouseDown = false;

    if (isDrawingMask) {
      isDrawingMask = false;
      if (activeStrokePoints.length > 0) {
        onApplyMaskEdit({
          type: maskTool,
          action: maskAction,
          points: [...activeStrokePoints],
          radius: brushRadius,
          region: lassoRegion
        });
        activeStrokePoints = [];
      }
    }
  }
</script>

<div class="workspace">
  <CanvasToolbar
    {t}
    {viewMode}
    bind:originalColorMode
    bind:maskDisplayMode
    bind:overlayColorMode
    bind:overlayBase
    bind:maskTool
    bind:maskAction
    bind:brushRadius
    bind:lassoRegion
    bind:vectorTool
    bind:canvasBg
    bind:nodesMode
    {nodeRenderStats}
    nodeDetailBudget={NODE_DETAIL_BUDGET}
    nodeMinZoom={NODE_MIN_ZOOM}
    selectedNodeCount={totalSelectedNodesCount}
    hasImage={!!originalImage}
    hasContours={contours.length > 0}
    {totalNodeCount}
    {canUndoMask}
    {canRedoMask}
    {hasMaskEdits}
    onToggleOriginal={toggleOriginalMode}
    onToggleMask={toggleMaskMode}
    onToggleOverlay={toggleOverlayMode}
    onToggleVector={toggleVectorMode}
    {onUndoMask}
    {onRedoMask}
    {onResetMaskEdits}
  />

  <div
    bind:this={canvasWrapEl}
    class="canvas-area"
    style:cursor={activeCursor}
    class:panning={isPanning}
    class:has-image={!!originalImage}
    onwheel={handleWheel}
    onpointerdown={handlePointerDown}
    onpointermove={handlePointerMove}
    onpointerup={handlePointerUp}
    onpointercancel={handlePointerUp}
    onpointerenter={() => (isCursorInside = true)}
    onpointerleave={(e) => {
      isCursorInside = false;
      handlePointerUp(e);
    }}
    onclick={handleCanvasClick}
  >
    {#if !originalImage}
      <CanvasDropzone {t} {onFileSelected} />
    {:else}
      <button
        type="button"
        class="change-image-btn canvas-chip"
        onclick={() => fileInputEl?.click()}
        title="Upload new image"
      >
        <span>↗</span>
        <span>{t.changeImage}</span>
      </button>
      <input
        bind:this={fileInputEl}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        class="sr-only"
        onchange={(e) => {
          const input = e.currentTarget as HTMLInputElement;
          if (input.files?.[0]) onFileSelected(input.files[0]);
        }}
      />

      <CanvasStage
        {width}
        {height}
        {viewMode}
        {maskDisplayMode}
        {canvasBg}
        {overlayColorMode}
        {overlayBase}
        {panX}
        {panY}
        {zoomLevel}
        {viewWindow}
        {viewportBusy}
        {invScale}
        {vectorFillColor}
        combinedSvgPath={culledSvgPath}
        {individualPathStrings}
        {selectedContoursCombinedPath}
        {selectedOutlinePath}
        {hoveredContourPath}
        {hoveredOutlinePath}
        {activeStrokePoints}
        {maskTool}
        {maskAction}
        {lassoRegion}
        {brushRadius}
        {liveBrushPath}
        {revealKey}
        {revealTimings}
        {carveMassPath}
        fullAreaPath={combinedSvgPath}
        {revealPending}
        revealStyle={activeRevealStyle}
        bind:baseCanvasEl
        bind:maskCanvasEl
        onRevealDone={() => (revealKey = 0)}
      />

      <canvas bind:this={nodeCanvasEl} class="node-layer"></canvas>

      {#if viewMode === 'mask' && maskTool === 'brush' && isCursorInside}
        <div
          class="brush-cursor-circle"
          class:action-remove={maskAction === 'remove'}
          class:action-add={maskAction === 'add'}
          class:action-auto={maskAction === 'auto'}
          style:left="{cursorX}px"
          style:top="{cursorY}px"
          style:width="{brushRadius * 2 * (zoomLevel / 100)}px"
          style:height="{brushRadius * 2 * (zoomLevel / 100)}px"
        ></div>
      {/if}
    {/if}

    {#if isHeavyResult && onReduceDetail && !perfDismissed}
      <div class="perf-notice" class:expanded={perfExpanded} role="status">
        <button
          type="button"
          class="perf-summary"
          aria-expanded={perfExpanded}
          onclick={() => (perfExpanded = !perfExpanded)}
        >
          <span class="perf-dot"></span>
          <span class="perf-count">{t.perfCount(totalNodeCount, contours.length)}</span>
          <span class="perf-chevron">{perfExpanded ? '▾' : '▸'}</span>
        </button>

        {#if perfExpanded}
          <p class="perf-hint">{t.perfHint}</p>
          <div class="perf-actions">
            <button type="button" class="perf-reduce" onclick={onReduceDetail}>
              {t.perfReduce}
            </button>
            <button
              type="button"
              class="perf-dismiss"
              onclick={() => (perfDismissed = true)}
            >
              {t.perfDismiss}
            </button>
          </div>
        {/if}
      </div>
    {/if}

    <CanvasStatusBar
      {t}
      {isTracing}
      {traceProgress}
      {traceFinishing}
      {traceStage}
      contoursCount={contours.length}
      {totalNodeCount}
      {debouncedHoveredIdx}
      {hoveredContourNodesCount}
      {hoveredContourArea}
      {selectedIndices}
      {singleSelectedNodesCount}
      {singleSelectedArea}
      {totalSelectedNodesCount}
      {totalSelectedArea}
      onClearSelection={handleClearSelection}
    />

    <div class="floating-zoom canvas-chip canvas-chip--icons" onpointerdown={(e) => e.stopPropagation()}>
      <ZoomControls
        {t}
        {zoomLevel}
        hasImage={!!originalImage}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onFitToScreen={fitToScreen}
      />
    </div>
  </div>
</div>

<style>
  .floating-zoom {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 32;
  }

  .floating-zoom :global(.zoom-controls) {
    background: transparent;
    border: 0;
    border-radius: 0;
    padding: 0;
  }

  .perf-notice {
    position: absolute;
    left: 50%;
    bottom: 46px;
    z-index: 35;
    transform: translateX(-50%);
    max-width: min(420px, calc(100% - 24px));
    border-radius: 9px;
    border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
    background: rgba(19, 21, 32, 0.92);
    backdrop-filter: blur(6px);
  }

  .perf-notice.expanded {
    border-color: var(--border-strong, rgba(255, 255, 255, 0.16));
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.45);
  }

  .perf-summary {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 6px 10px;
    border: 0;
    background: transparent;
    color: var(--muted, #94a3b8);
    font: 600 10.5px/1 var(--font-mono, ui-monospace, monospace);
    cursor: pointer;
  }

  .perf-summary:hover {
    color: var(--text, #f8fafc);
  }

  .perf-dot {
    width: 5px;
    height: 5px;
    flex-shrink: 0;
    border-radius: 50%;
    background: #f59e0b;
  }

  .perf-count {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .perf-chevron {
    margin-left: auto;
    flex-shrink: 0;
    opacity: 0.7;
  }

  .perf-hint {
    margin: 0;
    padding: 0 10px 8px;
    color: var(--muted, #94a3b8);
    font-size: 11px;
    line-height: 1.5;
  }

  .perf-actions {
    display: flex;
    gap: 8px;
    padding: 0 10px 10px;
  }

  .perf-reduce,
  .perf-dismiss {
    padding: 6px 12px;
    border-radius: 7px;
    border: 1px solid var(--border-strong, rgba(255, 255, 255, 0.16));
    background: transparent;
    color: var(--text, #f8fafc);
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
  }

  .perf-reduce {
    border-color: transparent;
    background: #2563eb;
    color: #ffffff;
  }

  .perf-reduce:hover {
    background: #1d4ed8;
  }

  .perf-dismiss {
    color: var(--muted, #94a3b8);
  }

  .perf-dismiss:hover {
    color: var(--text, #f8fafc);
  }

  .workspace {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    min-width: 0;

    container-type: inline-size;
    container-name: workspace;
    background: #090a0f;
    position: relative;
    overflow: visible;
    padding: 10px 14px 14px;
    gap: 8px;
  }

  .canvas-area {
    touch-action: auto;
    flex: 1;
    min-height: 0;
    min-width: 0;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #1e2232;
    border-radius: 14px;
    background-color: #0d0f17;
    background-image: linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px);
    background-size: 28px 28px;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 12px 36px rgba(0, 0, 0, 0.5);
    cursor: default;
    overscroll-behavior-x: none;
    overscroll-behavior-y: auto;
  }

  .canvas-area.has-image {
    touch-action: none;
  }

  .change-image-btn {
    position: absolute;
    top: 12px;
    left: 12px;
    z-index: 30;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  }

  @media (max-width: 640px) {
    .workspace {
      padding: 6px 6px 8px;
      gap: 6px;
    }

    .canvas-area {
      border-radius: 10px;
    }

    .change-image-btn {
      top: 8px;
      left: 8px;
    }

    .floating-zoom {
      top: 8px;
      right: 8px;
    }

    .perf-notice {
      bottom: 40px;
      max-width: calc(100% - 16px);
    }
  }

  .change-image-btn:hover {
    background: #2563eb;
    border-color: #3b82f6;
    color: #ffffff;
    box-shadow: 0 0 16px rgba(59, 130, 246, 0.4);
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  .node-layer {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 25;
  }

  .brush-cursor-circle {
    position: fixed;
    border: 1.5px solid rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    pointer-events: none;
    transform: translate(-50%, -50%);
    z-index: 100;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(0, 0, 0, 0.3);
  }

  .brush-cursor-circle.action-remove {
    border-color: #ef4444;
    background: rgba(239, 68, 68, 0.15);
  }

  .brush-cursor-circle.action-add {
    border-color: #10b981;
    background: rgba(16, 185, 129, 0.15);
  }

  .brush-cursor-circle.action-auto {
    border-color: #8b5cf6;
    background: rgba(139, 92, 246, 0.15);
  }
</style>
