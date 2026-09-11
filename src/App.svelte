<script lang="ts">
  import { onMount } from 'svelte';
  import { translations, detectUserLocale, saveUserLocale, type Locale } from './lib/i18n';
  import Header from './lib/components/Header.svelte';
  import CanvasViewer from './lib/components/CanvasViewer.svelte';
  import Inspector from './lib/components/Inspector.svelte';
  import ExportPanel from './lib/components/ExportPanel.svelte';
  import LandingStory from './lib/components/LandingStory.svelte';
  import LegalPage from './lib/components/LegalPage.svelte';
  import UpdateToast from './lib/components/UpdateToast.svelte';
  import { hasLegal } from './lib/legal';
  import ReplaceImageDialog from './lib/components/ReplaceImageDialog.svelte';
  import { useTraceWorker } from './lib/hooks/useTraceWorker.svelte';
  import { rasterizeMaskEdit } from './lib/canvas/maskDrawing';
  import { diffMask, applyPatch, MASK_HISTORY_LIMIT, type MaskPatch } from './lib/core/maskHistory';
  import type { PreprocessOptions, TraceOptions, ProcessedImageData, Point } from './lib/core/types';
  import { preprocessImage, otsuOfField, chooseSoftenRadius } from './lib/core/preprocess';
  import { fitToTraceBudget } from './lib/core/sourceBudget';
  import { markStage, clearStage, takeLastStage } from './lib/core/crashBreadcrumb';
  import { tracePreference, demoteAfterCrash } from './lib/core/tracePreference.svelte';
  import { traceMaxEdge } from './lib/core/sourceBudget';
  import { DEFAULT_SCALE } from './lib/core/outputScale';
  import {
    analyzeSource,
    projectToGray,
    flattenIllumination,
    measureStrokeWidth,
    LUMA,
    type SourceProfile
  } from './lib/core/imageAnalysis';
  import {
    proposeFor,
    allMeasured,
    isFullyAuto,
    type Picture,
    type Origins,
    type SettingKey
  } from './lib/core/settings';
  import { exportToSvg } from './lib/exporters/svg';
  import { exportToPdf } from './lib/exporters/pdf';
  import { exportToEps } from './lib/exporters/eps';
  import { exportToDxf } from './lib/exporters/dxf';
  import { exportToPng } from './lib/exporters/png';

  let locale = $state<Locale>(detectUserLocale());
  let t = $derived(translations[locale]);

  let path = $state(typeof window !== 'undefined' ? window.location.pathname : '/');
  let showLegal = $derived(hasLegal && /\/impressum\/?$/.test(path));

  function navigate(to: string) {
    window.history.pushState({}, '', to);
    path = to;
    window.scrollTo({ top: 0 });
  }

  $effect(() => {
    document.body.style.overflow = showLegal ? 'hidden' : '';
  });

  function setLocale(newLoc: Locale) {
    locale = newLoc;
    saveUserLocale(newLoc);
    const targetPath = newLoc === 'de' ? '/de' : '/';
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ locale: newLoc }, '', targetPath);
    }
  }

  onMount(() => {
    saveUserLocale(locale);

    const died = takeLastStage();
    if (died) {
      if (died.stage === 'trace' || died.stage === 'render') demoteAfterCrash();
      setStatus(t.status.lastRunDied(died.stage, `${died.width}×${died.height}`, died.contours), 'error');
    }

    const onPopState = () => {
      path = window.location.pathname;
      locale = detectUserLocale();
      saveUserLocale(locale);
    };
    window.addEventListener('popstate', onPopState);

    const onLeave = () => clearStage();
    window.addEventListener('pagehide', onLeave);

    return () => {
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('pagehide', onLeave);
    };
  });

  let lastOpenedSerial = -1;
  $effect(() => {
    if (originalImage && imageSerial !== lastOpenedSerial) {
      lastOpenedSerial = imageSerial;
      isSidebarCollapsedMobile = false;
    }
  });

  let preprocess = $state<PreprocessOptions>({
    threshold: 128,
    blur: 0,
    minDetail: 4,
    invert: false
  });

  let trace = $state<TraceOptions>({
    mode: 'subpixel',
    edgeSmooth: 2,
    simplifyTolerance: 0.2
  });

  let originalImage = $state<HTMLCanvasElement | null>(null);

  let imageSerial = $state<number>(0);
  let processedData = $state<ProcessedImageData | null>(null);
  let statusText = $state<string>('');
  let statusTone = $state<'info' | 'error'>('info');

  function setStatus(text: string, tone: 'info' | 'error' = 'info') {
    statusText = text;
    statusTone = tone;
  }
  let filename = $state<string>('vectorized');

  const traceWorker = useTraceWorker({
    onCalculated: (count) => {
      const size = traceSize ?? { width: 0, height: 0 };
      markStage({ stage: 'render', width: size.width, height: size.height, contours: count });
      requestAnimationFrame(() => requestAnimationFrame(clearStage));
      setStatus(t.status.calculated(count));
    },
    onError: (errorMsg) => {
      setStatus(t.status.error(errorMsg), 'error');
    }
  });

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  let sourceScale = $state<number>(1);

  let sourceSize = $state.raw<{ width: number; height: number } | null>(null);
  let traceSize = $state.raw<{ width: number; height: number } | null>(null);

  let resample = $derived(
    sourceScale > 1 && sourceSize && traceSize ? { from: sourceSize, to: traceSize } : null
  );

  let sourceProfile = $state.raw<SourceProfile | null>(null);
  let useAutoChannel = $state(true);
  let useFlattenLighting = $state(true);

  let picture = $state.raw<Picture | null>(null);
  let proposal = $derived(proposeFor(picture));
  let origins = $state<Origins>(allMeasured());

  function applyProposal() {
    const p = proposal;
    preprocess = { ...preprocess, ...p.pre };
    trace = { ...trace, ...p.trace };
    origins = allMeasured();
  }

  function markEdited(key: SettingKey) {
    if (origins[key] !== 'user') origins = { ...origins, [key]: 'user' };
  }

  function revertSetting(key: SettingKey) {
    const p = proposal;
    if (key in p.pre) {
      preprocess = { ...preprocess, [key]: p.pre[key as keyof typeof p.pre] };
    } else {
      trace = { ...trace, [key]: p.trace[key as keyof typeof p.trace] };
    }
    origins = { ...origins, [key]: 'measured' };
  }

  let channelAvailable = $derived(!!sourceProfile?.usesChannelMix);
  let lightingAvailable = $derived(!!sourceProfile?.usesIllumination);

  let channelActive = $derived(channelAvailable && useAutoChannel);
  let lightingActive = $derived(lightingAvailable && useFlattenLighting);

  let sourceField = $derived.by(() => {
    const canvas = originalImage;
    const profile = sourceProfile;
    if (!canvas || !profile || !canvas.width || !canvas.height) return null;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);

    let gray = projectToGray(img, channelActive ? profile.projection : LUMA);
    if (lightingActive && profile.illumination) {
      gray = flattenIllumination(gray, img.width, img.height, profile.illumination);
    }
    return { width: img.width, height: img.height, gray };
  });

  function readSource(img: HTMLImageElement): {
    data: ImageData;
    canvas: HTMLCanvasElement;
    scale: number;
  } {
    const sw = img.naturalWidth || img.width;
    const sh = img.naturalHeight || img.height;
    const fit = fitToTraceBudget(sw, sh, traceMaxEdge(tracePreference.detail, tracePreference.demoted));
    markStage({ stage: 'decode', width: fit.width, height: fit.height });

    const canvas = document.createElement('canvas');
    canvas.width = fit.width;
    canvas.height = fit.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, fit.width, fit.height);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, fit.width, fit.height);
    return { data: ctx.getImageData(0, 0, fit.width, fit.height), canvas, scale: fit.scale };
  }

  function runPipeline() {
    if (!originalImage || !sourceField) return;
    markStage({ stage: 'preprocess', width: sourceField.width, height: sourceField.height });
    setStatus(t.status.processing);

    try {
      const isFirstPass = !processedData;
      const result = preprocessImage(sourceField, preprocess);

      if (isFirstPass) {
        baseMask = result.mask.slice();
        maskPatches = [];
        historyIndex = 0;
      }

      processedData = result;
    } catch (err: any) {
      setStatus(t.status.error(err?.message || String(err)), 'error');
    }
  }

  $effect(() => {
    if (!traceWorker.isProcessing) return;
    const size = traceSize ?? { width: 0, height: 0 };
    markStage({ stage: 'trace', width: size.width, height: size.height });
  });

  function schedulePipeline() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(runPipeline, 40);
  }

  $effect(() => {
    const _key = `${preprocess.threshold}|${preprocess.blur}|${preprocess.minDetail}|${preprocess.invert}|${trace.mode}|${trace.edgeSmooth}|${trace.simplifyTolerance}`;
    void sourceField;

    if (originalImage) {
      schedulePipeline();
    }
  });

  let objectUrl = $state<string | null>(null);

  function adoptImage(img: HTMLImageElement, adopt: (() => void) | null, onFail: () => void) {
    {
      let read: { data: ImageData; canvas: HTMLCanvasElement; scale: number };
      try {
        read = readSource(img);
      } catch (err: any) {
        onFail();
        setStatus(t.status.error(err?.message || String(err)), 'error');
        return;
      }
      sourceScale = read.scale;
      sourceSize = { width: img.naturalWidth || img.width, height: img.naturalHeight || img.height };
      traceSize = { width: read.data.width, height: read.data.height };

      adopt?.();
      originalImage = read.canvas;
      imageSerial++;

      const profile = analyzeSource(read.data);
      sourceProfile = profile;

      const field = sourceField;
      if (field) {
        const otsu = otsuOfField(field.gray);
        picture = {
          profile,
          otsuThreshold: otsu,
          strokeWidthPx: measureStrokeWidth(field.gray, field.width, field.height, otsu),
          softenRadius: chooseSoftenRadius(field.gray, field.width, field.height, otsu)
        };
      } else {
        picture = null;
      }

      applyProposal();
      processedData = null;
      baseMask = null;
      maskPatches = [];
      historyIndex = 0;
      schedulePipeline();
    }
  }

  function handleFileSelected(file: File) {
    if (!file.type.startsWith('image/')) return;
    filename = file.name.replace(/\.[^/.]+$/, '');
    setStatus(t.status.loading);

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () =>
      adoptImage(
        img,
        () => {
          if (objectUrl) URL.revokeObjectURL(objectUrl);
          objectUrl = url;
        },
        () => URL.revokeObjectURL(url)
      );
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setStatus(t.status.error(file.name), 'error');
    };
    img.src = url;
  }

  let detailKey = `${tracePreference.detail}|${tracePreference.demoted}`;
  function reloadAtCurrentDetail() {
    const url = objectUrl;
    if (!url || !originalImage) return;
    setStatus(t.status.loading);
    const img = new Image();
    img.onload = () => adoptImage(img, null, () => {});
    img.onerror = () => setStatus(t.status.error(filename), 'error');
    img.src = url;
  }

  $effect(() => {
    const key = `${tracePreference.detail}|${tracePreference.demoted}`;
    if (key === detailKey) return;
    detailKey = key;
    reloadAtCurrentDetail();
  });

  function handleReduceDetail() {
    const next = Math.max(preprocess.minDetail + 2, Math.round(preprocess.minDetail * 1.6));
    preprocess.minDetail = Math.min(48, next);
  }

  let pendingImage = $state<{ file: File; source: 'drop' | 'paste' } | null>(null);
  let isDragTarget = $state(false);
  let dragDepth = 0;

  function offerImage(file: File, source: 'drop' | 'paste') {
    if (!file.type.startsWith('image/')) return;
    if (!originalImage) {
      handleFileSelected(file);
      return;
    }
    pendingImage = { file, source };
  }

  function confirmPendingImage() {
    const p = pendingImage;
    pendingImage = null;
    if (p) handleFileSelected(p.file);
  }

  function handleWindowDrop(e: DragEvent) {
    dragDepth = 0;
    isDragTarget = false;
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    e.preventDefault();
    offerImage(file, 'drop');
  }

  function handleDragEnter(e: DragEvent) {
    if (!e.dataTransfer?.types?.includes('Files')) return;
    dragDepth++;
    isDragTarget = true;
  }

  function handleDragLeave() {
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) isDragTarget = false;
  }

  function handleDragOver(e: DragEvent) {
    if (e.dataTransfer?.types?.includes('Files')) e.preventDefault();
  }

  function handlePaste(e: ClipboardEvent) {
    const el = document.activeElement;
    if (el instanceof HTMLInputElement && el.type !== 'range') return;
    if (el instanceof HTMLTextAreaElement || (el as HTMLElement)?.isContentEditable) return;

    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.kind !== 'file' || !item.type.startsWith('image/')) continue;
      const file = item.getAsFile();
      if (!file) continue;
      e.preventDefault();
      offerImage(file, 'paste');
      return;
    }
  }

  let baseMask = $state.raw<Uint8Array | null>(null);

  let maskPatches = $state.raw<MaskPatch[]>([]);

  let historyIndex = $state<number>(0);

  let canUndoMask = $derived(historyIndex > 0);
  let canRedoMask = $derived(historyIndex < maskPatches.length);
  let hasMaskEdits = $derived(historyIndex > 0 || maskPatches.length > 0);

  function handleApplyMaskEdit(edit: {
    type: 'brush' | 'lasso';
    action: 'add' | 'remove' | 'auto';
    points: Point[];
    radius: number;
    region?: 'inside' | 'outside';
  }) {
    if (!processedData || edit.points.length === 0) return;

    const { width, height, mask } = processedData;
    const newMask = rasterizeMaskEdit(width, height, mask, edit, baseMask);

    const patch = diffMask(mask, newMask);
    if (!patch) return;

    const kept = maskPatches.slice(0, historyIndex);
    kept.push(patch);
    if (kept.length > MASK_HISTORY_LIMIT) kept.shift();
    maskPatches = kept;
    historyIndex = kept.length;

    processedData = { ...processedData, mask: newMask };
  }

  function handleUndoMask() {
    if (!processedData || historyIndex <= 0) return;
    const newMask = applyPatch(processedData.mask, maskPatches[historyIndex - 1], 'undo');
    historyIndex--;
    processedData = { ...processedData, mask: newMask };
  }

  function handleRedoMask() {
    if (!processedData || historyIndex >= maskPatches.length) return;
    const newMask = applyPatch(processedData.mask, maskPatches[historyIndex], 'redo');
    historyIndex++;
    processedData = { ...processedData, mask: newMask };
  }

  function handleResetMaskEdits() {
    if (!processedData || !baseMask) return;

    historyIndex = 0;
    processedData = { ...processedData, mask: baseMask.slice() };
  }

  async function handleExport(format: 'pdf' | 'svg' | 'eps' | 'dxf' | 'png') {
    if (!processedData || traceWorker.contours.length === 0) return;

    const { width, height, mask } = processedData;
    let blob: Blob;
    let ext = format;

    const outputScale = { dpi: DEFAULT_SCALE.dpi / sourceScale };

    setStatus(t.status.generating(format));

    switch (format) {
      case 'svg':
        blob = exportToSvg(traceWorker.contours, width, height, trace.edgeSmooth, outputScale);
        break;
      case 'pdf':
        blob = exportToPdf(traceWorker.contours, width, height, trace.edgeSmooth, outputScale);
        break;
      case 'eps':
        blob = exportToEps(traceWorker.contours, width, height, trace.edgeSmooth, outputScale);
        break;
      case 'dxf':
        blob = exportToDxf(traceWorker.contours, width, height, trace.edgeSmooth, 6, outputScale);
        break;
      case 'png':
        blob = await exportToPng(mask, width, height);
        break;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-vector-oso.${ext}`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(url);
    }, 1000);

    setStatus(t.status.downloaded(a.download));
  }

  let currentViewMode = $state<'original' | 'mask' | 'overlay' | 'vector'>('vector');

  let needsVectors = $derived(currentViewMode === 'vector' || currentViewMode === 'overlay');
  let tracedFor: ProcessedImageData | null = null;

  $effect(() => {
    if (!needsVectors) return;
    const data = processedData;
    if (!data || tracedFor === data) return;
    tracedFor = data;
    traceWorker.dispatchTrace(data, preprocess.threshold, trace);
  });
  const SIDEBAR_MIN = 280;
  const SIDEBAR_KEY = 'vector_oso_sidebar_w';

  let isSidebarCollapsedMobile = $state(
    typeof window === 'undefined' ? true : window.innerWidth < 640
  );

  let sidebarWidth = $state<number | null>(null);
  let resizing = $state(false);
  let resizeFrom = 0;
  let resizeStartWidth = 0;

  function sidebarMax() {
    return typeof window === 'undefined' ? 620 : Math.min(620, window.innerWidth * 0.5);
  }

  function onSplitDown(e: PointerEvent & { currentTarget: HTMLElement }) {
    const el = document.querySelector('.sidebar') as HTMLElement | null;
    if (!el) return;
    resizing = true;
    resizeFrom = e.clientX;
    resizeStartWidth = el.getBoundingClientRect().width;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {  }
  }

  function onSplitMove(e: PointerEvent) {
    if (!resizing) return;
    if (e.buttons === 0) {
      resizing = false;
      return;
    }
    const next = resizeStartWidth - (e.clientX - resizeFrom);
    sidebarWidth = Math.round(Math.max(SIDEBAR_MIN, Math.min(sidebarMax(), next)));
  }

  function onSplitUp(e: PointerEvent & { currentTarget: HTMLElement }) {
    if (!resizing) return;
    resizing = false;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {  }
    try {
      if (sidebarWidth !== null) localStorage.setItem(SIDEBAR_KEY, String(sidebarWidth));
    } catch {}
  }

  $effect(() => {
    const el = sidebarScrollEl;
    if (!el) return;

    const onStart = () => {
      const atTop = el.scrollTop <= 0;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
      el.style.overscrollBehaviorY = atTop || atBottom ? 'auto' : 'none';
    };
    const onEnd = () => {
      el.style.overscrollBehaviorY = 'auto';
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchend', onEnd, { passive: true });
    el.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onEnd);
      el.style.overscrollBehaviorY = '';
    };
  });

  const SHEET_MIN = 140;
  const SHEET_CLOSE_AT = 72;
  const SHEET_KEY = 'vector_oso_sheet_h';

  let sheetHeight = $state<number | null>(null);
  let sheetDragging = $state(false);
  let sheetFrom = 0;
  let sheetStart = 0;
  let sheetMoved = false;
  let sheetBefore: number | null = null;

  function sheetMax() {
    return typeof window === 'undefined' ? 520 : Math.min(520, window.innerHeight * 0.7);
  }

  function onSheetDown(e: PointerEvent & { currentTarget: HTMLElement }) {
    const el = sidebarScrollEl;
    sheetFrom = e.clientY;
    sheetStart = isSidebarCollapsedMobile || !el
      ? 0
      : Math.round(el.getBoundingClientRect().height);

    sheetBefore = sheetHeight;
    sheetHeight = sheetStart;
    sheetMoved = false;
    sheetDragging = true;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {  }
  }

  function onSheetMove(e: PointerEvent) {
    if (!sheetDragging) return;
    const dy = sheetFrom - e.clientY;
    if (!sheetMoved && Math.abs(dy) < 3) return;
    sheetMoved = true;
    sheetHeight = Math.round(Math.max(0, Math.min(sheetMax(), sheetStart + dy)));
  }

  function onSheetUp(e: PointerEvent & { currentTarget: HTMLElement }) {
    if (!sheetDragging) return;
    sheetDragging = false;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {  }
    if (!sheetMoved) {
      sheetHeight = sheetBefore;
      return;
    }

    const dragged = sheetHeight ?? SHEET_MIN;
    if (dragged < SHEET_CLOSE_AT) {
      sheetHeight = 0;
      isSidebarCollapsedMobile = true;
      try { localStorage.removeItem(SHEET_KEY); } catch {}
      return;
    }

    sheetHeight = Math.max(SHEET_MIN, dragged);
    isSidebarCollapsedMobile = false;
    try { localStorage.setItem(SHEET_KEY, String(sheetHeight)); } catch {}
  }

  function toggleSheet() {
    if (isSidebarCollapsedMobile && (sheetHeight === null || sheetHeight < SHEET_MIN)) {
      sheetHeight = null;
    }
    isSidebarCollapsedMobile = !isSidebarCollapsedMobile;
  }

  function resetSplit() {
    sidebarWidth = null;
    try { localStorage.removeItem(SIDEBAR_KEY); } catch {}
  }

  function resetSheet() {
    sheetHeight = null;
    try { localStorage.removeItem(SHEET_KEY); } catch {}
  }

  onMount(() => {
    try {
      const saved = Number(localStorage.getItem(SIDEBAR_KEY));
      if (Number.isFinite(saved) && saved >= SIDEBAR_MIN) {
        sidebarWidth = Math.min(saved, sidebarMax());
      }
      const savedSheet = Number(localStorage.getItem(SHEET_KEY));
      if (Number.isFinite(savedSheet) && savedSheet >= SHEET_MIN) {
        sheetHeight = Math.min(savedSheet, sheetMax());
      }
    } catch {}
  });

  let sidebarPanelEl = $state<HTMLElement>();
  let sidebarScrollEl = $state<HTMLElement>();
  let drawerWasCollapsed = true;

  const MOBILE_DRAWER_QUERY = '(max-width: 900px)';

  function scrollDrawerToActiveSection() {
    const scroller = sidebarScrollEl;
    if (!scroller || !window.matchMedia(MOBILE_DRAWER_QUERY).matches) return;

    const id = currentViewMode === 'vector' || currentViewMode === 'overlay'
      ? '#section-vector'
      : '#section-mask';
    const target = scroller.querySelector<HTMLElement>(id);
    if (!target) return;

    const top =
      target.getBoundingClientRect().top -
      scroller.getBoundingClientRect().top +
      scroller.scrollTop;

    scroller.scrollTo({
      top: Math.max(0, top - 8),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    });
  }

  $effect(() => {
    const collapsed = isSidebarCollapsedMobile;
    void currentViewMode;

    const opening = drawerWasCollapsed && !collapsed;
    drawerWasCollapsed = collapsed;

    if (collapsed || !sidebarPanelEl) return;

    if (!opening) {
      scrollDrawerToActiveSection();
      return;
    }

    const panel = sidebarPanelEl;
    let done = false;
    const run = () => {
      if (done) return;
      done = true;
      clearTimeout(fallback);
      panel.removeEventListener('transitionend', onEnd);
      scrollDrawerToActiveSection();
    };
    const onEnd = (e: TransitionEvent) => {
      if (e.propertyName === 'grid-template-rows') run();
    };
    const fallback = setTimeout(run, 400);
    panel.addEventListener('transitionend', onEnd);

    return () => {
      done = true;
      clearTimeout(fallback);
      panel.removeEventListener('transitionend', onEnd);
    };
  });

  let viewModeTitle = $derived.by(() => {
    switch (currentViewMode) {
      case 'original':
        return locale === 'de' ? 'Originalbild' : 'Original Image';
      case 'mask':
        return locale === 'de' ? 'Masken-Binarisierung' : 'Mask Binarization';
      case 'overlay':
        return locale === 'de' ? 'Vektor-Overlay' : 'Vector Overlay';
      case 'vector':
      default:
        return locale === 'de' ? 'SVG Vektor' : 'SVG Vector';
    }
  });
</script>

<svelte:window
  ondrop={handleWindowDrop}
  ondragover={handleDragOver}
  ondragenter={handleDragEnter}
  ondragleave={handleDragLeave}
  onpaste={handlePaste}
/>

<ReplaceImageDialog
  t={t.replace}
  pending={pendingImage}
  currentSrc={objectUrl}
  hasEdits={hasMaskEdits}
  onConfirm={confirmPendingImage}
  onCancel={() => (pendingImage = null)}
/>

<UpdateToast t={t.pwa} />

{#if showLegal}
  <LegalPage t={t.legal} {locale} onClose={() => navigate(locale === 'de' ? '/de' : '/')} />
{/if}

<div class="app-shell" id="tool" class:drag-target={isDragTarget}>
  <Header
    tBrand={t.brand}
    tPwa={t.pwa}
    {locale}
    hasImage={!!originalImage}
    isProcessing={traceWorker.isProcessing}
    {statusText}
    {statusTone}
    onLocaleChange={setLocale}
  />

  <main
    class="editor-shell"
    class:sidebar-collapsed-mobile={isSidebarCollapsedMobile}
    style:--sidebar-w={sidebarWidth === null ? null : `${sidebarWidth}px`}
    style:--sheet-h={sheetHeight === null ? null : `${sheetHeight}px`}
  >
    <CanvasViewer
      t={t.canvas}
      isTracing={traceWorker.isProcessing}
      traceProgress={traceWorker.progress}
      traceFinishing={traceWorker.finishing}
      traceStage={traceWorker.stage}
      {originalImage}
      {imageSerial}
      mask={processedData?.mask || null}
      width={processedData?.width || 0}
      height={processedData?.height || 0}
      contours={traceWorker.contours}
      smoothFactor={trace.edgeSmooth}
      bind:viewMode={currentViewMode}
      {canUndoMask}
      {canRedoMask}
      {hasMaskEdits}
      onFileSelected={handleFileSelected}
      onReduceDetail={handleReduceDetail}
      onApplyMaskEdit={handleApplyMaskEdit}
      onUndoMask={handleUndoMask}
      onRedoMask={handleRedoMask}
      onResetMaskEdits={handleResetMaskEdits}
    />

    <div
      class="split-handle"
      class:active={resizing}
      role="separator"
      aria-orientation="vertical"
      aria-label={locale === 'de' ? 'Breite der Regler' : 'Controls width'}
      onpointerdown={onSplitDown}
      onpointermove={onSplitMove}
      onpointerup={onSplitUp}
      onpointercancel={onSplitUp}
      ondblclick={resetSplit}
    ></div>

    <div
      class="sheet-resize-edge"
      class:active={sheetDragging}
      role="separator"
      aria-orientation="horizontal"
      aria-label={locale === 'de' ? 'Höhe der Regler' : 'Controls height'}
      onpointerdown={onSheetDown}
      onpointermove={onSheetMove}
      onpointerup={onSheetUp}
      onpointercancel={onSheetUp}
      ondblclick={resetSheet}
    ><span></span></div>

    <div
      class="sidebar"
      class:collapsed={isSidebarCollapsedMobile}
      class:dragging={sheetDragging}
    >
      <div class="mobile-bottom-dock">

        <div
          class="sheet-handle-zone"
          onclick={toggleSheet}
          onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleSheet();
            }
          }}
          role="button"
          tabindex="0"
          aria-expanded={!isSidebarCollapsedMobile}
          aria-label={isSidebarCollapsedMobile ? 'Regler öffnen' : 'Regler zuklappen'}
        >
          <div class="sheet-handle-content">
            <span class="sheet-icon">⚙️</span>
            <span class="sheet-title">{viewModeTitle}</span>
            <span class="sheet-arrow" class:open={!isSidebarCollapsedMobile}>▲</span>
          </div>
        </div>

        <div class="mobile-dock-export">
          <ExportPanel
            t={t.export}
            disabled={!originalImage || traceWorker.contours.length === 0}
            onExport={handleExport}
          />
        </div>
      </div>

      <div class="sidebar-content" bind:this={sidebarPanelEl}>
        <div class="sidebar-scroll" bind:this={sidebarScrollEl}>
          <Inspector
            t={t.inspector}
            bind:preprocess
            bind:trace
            histogram={processedData?.histogram || null}
            {sourceProfile}
            {resample}
            strokeWidthPx={picture?.strokeWidthPx ?? 1}
            {proposal}
            anyEdited={!isFullyAuto(origins)}
            onEdited={markEdited}
            onRevert={revertSetting}
            onRevertAll={applyProposal}
            {channelAvailable}
            {lightingAvailable}
            bind:useAutoChannel
            bind:useFlattenLighting
            disabled={!originalImage}
            viewMode={currentViewMode}
          />
          <div class="desktop-only-export">
            <ExportPanel
              t={t.export}
              disabled={!originalImage || traceWorker.contours.length === 0}
              onExport={handleExport}
            />
          </div>
        </div>
      </div>
    </div>
  </main>

  <LandingStory t={t.landing} tLegal={t.legal} {locale} onNavigate={navigate} />
</div>

<style>
  .app-shell.drag-target::after {
    content: '';
    position: fixed;
    inset: 0;
    z-index: 150;
    pointer-events: none;
    border: 3px solid #3b82f6;
    box-shadow: inset 0 0 40px rgba(59, 130, 246, 0.25);
  }

  .app-shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: #08090d;
    color: #f1f5f9;
  }

  .editor-shell {
    display: flex;
    height: calc(100vh - 56px);
    height: calc(100svh - 56px);
    max-height: calc(100vh - 56px);
    max-height: calc(100svh - 56px);
    min-height: 520px;
    background: #090a0f;
    position: relative;

    overflow: hidden;
    overflow: clip;
    border-bottom: 1px solid #1a1e2c;
  }

  .sidebar {
    width: var(--sidebar-w, clamp(300px, 26vw, 440px));
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #0d0e15;
    flex-shrink: 0;
    overflow: hidden;
    overflow: clip;
    z-index: 20;
  }

  .sheet-resize-edge {
    display: none;
  }

  .split-handle {
    flex: 0 0 5px;
    align-self: stretch;
    position: relative;
    cursor: col-resize;
    background: #1a1e2c;
    touch-action: none;
    z-index: 21;
    transition: background 0.15s ease;
  }

  .split-handle::before {
    content: '';
    position: absolute;
    inset: 0 -6px;
  }

  .split-handle::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 2px;
    height: 34px;
    transform: translate(-50%, -50%);
    border-radius: 2px;
    background: #3a4056;
    transition: background 0.15s ease;
  }

  .split-handle:hover,
  .split-handle.active {
    background: #3b82f6;
  }

  .split-handle:hover::after,
  .split-handle.active::after {
    background: #93c5fd;
  }

  .sidebar-content {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .sidebar-scroll {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .desktop-only-export {
    display: block;
  }

  .mobile-bottom-dock {
    display: none;
  }

  @media (max-width: 900px) {
    .editor-shell {
      flex-direction: column;
      height: calc(100vh - 56px);
      height: calc(100svh - 56px);
      max-height: calc(100vh - 56px);
      max-height: calc(100svh - 56px);
      overflow: hidden;
      overflow: clip;
    }

    .desktop-only-export {
      display: none;
    }

    .split-handle {
      display: none;
    }

    .sheet-resize-edge {
      flex: 0 0 var(--sheet-edge-h, 20px);
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0f1118;
      border-top: 1px solid #1a1e2c;
      cursor: ns-resize;
      touch-action: none;
      z-index: 41;
    }

    .editor-shell.sidebar-collapsed-mobile .sheet-resize-edge {
      flex-basis: 16px;
    }

    .sheet-resize-edge span {
      width: 46px;
      height: 4px;
      border-radius: 2px;
      background: #3a4056;
      transition: background 0.15s ease, width 0.15s ease;
    }

    .sheet-resize-edge:hover span,
    .sheet-resize-edge.active span {
      width: 64px;
      background: #60a5fa;
    }

    .sidebar {
      width: 100%;
      height: auto;
      min-height: 0;
      max-height: none;
      border-left: 0;
      background: #0f1118;
      display: flex;
      flex-direction: column-reverse;
      flex-shrink: 0;
      z-index: 40;
    }

    .sidebar-content {
      flex: 0 0 auto;
      display: grid;
      grid-template-rows: 1fr;
      overflow: hidden;
      overflow: clip;
      background: #0d0e15;
      border-bottom: 1px solid #1f2330;
      box-shadow: inset 0 12px 16px -8px rgba(0, 0, 0, 0.7),
        inset 0 -12px 16px -8px rgba(0, 0, 0, 0.7);
      transition: grid-template-rows 0.22s cubic-bezier(0.22, 1, 0.36, 1),
        opacity 0.16s ease,
        border-color 0.22s ease;
    }

    .sidebar.collapsed .sidebar-content {
      grid-template-rows: 0fr;
      opacity: 0;
      border-bottom-color: transparent;
    }

    .sidebar.dragging .sidebar-content {
      grid-template-rows: 1fr;
      opacity: 1;
      border-bottom-color: #1f2330;
      transition: none;
    }

    .sidebar-scroll {
      display: block;
      min-height: 0;
      max-height: var(--sheet-h, min(280px, 44vh));
      overflow-y: auto;
      overflow-x: hidden;
      overscroll-behavior-x: contain;
      padding: 0;
      gap: 0;
    }

    .mobile-bottom-dock {
      display: flex;
      align-items: center;
      gap: 10px;
      height: var(--dock-h, 44px);
      padding: 3px 12px;
      background: #0f1118;
      box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.5);
      flex-shrink: 0;
    }

    .sheet-handle-zone {
      flex: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 2px 6px;
      cursor: pointer;
      user-select: none;
      border-radius: 8px;
      min-width: 0;
      touch-action: manipulation;
      transition: background 0.12s ease;
    }

    .sheet-handle-zone:active {
      background: rgba(255, 255, 255, 0.05);
    }

    .sheet-handle-content {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11.5px;
      font-weight: 750;
      color: #f1f5f9;
      min-width: 0;
    }

    .sheet-icon {
      font-size: 11px;
      flex-shrink: 0;
    }

    .sheet-title {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 175px;
    }

    .sheet-arrow {
      font-size: 9px;
      color: #60a5fa;
      display: inline-block;
      transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
      margin-left: 2px;
      flex-shrink: 0;
    }

    .sheet-arrow.open {
      transform: rotate(180deg);
    }

    .mobile-dock-export {
      flex-shrink: 0;
      width: 140px;
    }

    .mobile-dock-export :global(.export-panel) {
      padding: 0;
      background: transparent;
      border: 0;
    }

    .mobile-dock-export :global(.export-split-button) {
      height: 34px;
      border-radius: 8px;
    }

    .mobile-dock-export :global(.btn-title) {
      font-size: 11px;
    }

    .mobile-dock-export :global(.btn-ext-tag) {
      display: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .sidebar-content {
      transition-duration: 0.01ms;
    }
  }
</style>
