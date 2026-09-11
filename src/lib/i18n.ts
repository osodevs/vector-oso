export type Locale = 'en' | 'de';

export interface ViewOption {
  label: string;
  hint: string;
}

export interface Translations {
  brand: {
    name: string;
    tagline: string;
    badge: string;
    privacyTooltip: string;
    githubTooltip: string;
  };
  status: {
    loading: string;
    processing: string;
    calculated: (count: number) => string;
    generating: (format: string) => string;
    downloaded: (file: string) => string;
    error: (msg: string) => string;
    lastRunDied: (stage: string, size: string, contours?: number) => string;
  };
  inspector: {
    title: string;
    reset: string;
    autoBtn: string;
    presetDefault: string;
    presetDrawing: string;
    presetLogo: string;
    presetLaser: string;
    presetStencil: string;
    presetEdited: string;
    autoHintThreshold: string;
    autoHintNeutral: string;
    autoHintDetail: string;
    autoHintShape: string;
    histogram: {
      photo: string; adjusted: string;
      hint: string; range: string;
    };
    settingsHeader: string;
    vectorShapeHeader: string;
    thresholdLabel: string;
    thresholdTooltip: string;
    contrastLabel: string;
    contrastTooltip: string;
    brightnessLabel: string;
    brightnessTooltip: string;
    softenLabel: string;
    softenTooltip: string;
    softenOff: string;
    softenValue: (px: number) => string;
    autoHintSoften: string;
    minDetailLabel: string;
    minDetailTooltip: string;
    minDetailOff: string;
    minDetailValue: (px: number) => string;
    source: {
      sectionLabel: string;
      kind: (k: 'line' | 'solid' | 'photo' | 'drawing') => string;
      strokeMeta: (px: number) => string;
      resample: (from: string, to: string) => string;
      resampleTitle: string;
      detailLabel: string;
      detailOption: (c: 'auto' | 'full' | 'compact') => string;
      detailTitle: (c: 'auto' | 'full' | 'compact') => string;
      detailDemoted: string;
      detailDemotedTitle: string;
      colourLabel: string;
      colourNoop: string;
      colourFixed: (channel: 'red' | 'green' | 'blue') => string;
      colourTitle: (channel: 'red' | 'green' | 'blue', gain: string) => string;
      lightingLabel: string;
      lightingNoop: string;
      lightingFixed: string;
      lightingTitle: (levels: number) => string;
      levelsLabel: string;
      levelsNoop: string;
      levelsFixed: (factor: string) => string;
      levelsTitle: (factor: string) => string;
      offSuffix: string;
    };
    modeLabel: string;
    modeTooltip: string;
    modePixel: string;
    modeSubpixel: string;
    modePixelHint: string;
    modeSubpixelHint: string;
    edgeSmoothLabel: string;
    edgeSmoothTooltip: string;
    simplifyLabel: string;
    simplifyHint: string;
  };
  canvas: {
    viewOriginal: string;
    viewMask: string;
    viewOverlay: string;
    viewVector: string;
    viewOriginalTip: string;
    viewMaskTip: string;
    viewOverlayTip: string;
    viewVectorTip: string;
    brush: string;
    lasso: string;
    addMode: string;
    removeMode: string;
    brushSize: string;
    undo: string;
    redo: string;
    resetMask: string;
    lassoHint: string;
    lassoInsideTooltip: string;
    lassoOutsideTooltip: string;
    lassoOutsideSuffix: string;
    brushHint: string;
    fit: string;
    fitTooltip: string;
    bgGrid: string;
    bgWhite: string;
    bgDark: string;
    changeImage: string;
    dropTitle: string;
    dropSubtitle: string;
    uploadBtn: string;
    tracingStatus: string;
    traceFinishing: string;
    perfCount: (nodes: number, shapes: number) => string;
    perfHint: string;
    perfReduce: string;
    perfDismiss: string;
    traceStage: (stage: 'edges' | 'joining' | 'orienting' | 'curves') => string;
    pathsCount: (count: number) => string;
    nodesCount: (count: number) => string;
    pathRef: (num: number) => string;
    pathSelected: (num: number) => string;
    pathsSelected: (count: number) => string;
    nodesModeSelected: string;
    nodesModeAll: string;
    nodesModeOff: string;
    nodesTooltipSelected: string;
    nodesTooltipAll: string;
    nodesTooltipOff: string;
    nodesTriggerTooltip: (mode: string) => string;
    nodesTitle: string;
    nodesCapped: (drawn: number) => string;
    nodesNoHandles: (limit: number) => string;
    nodesBelowZoom: (pct: number) => string;
    nodesOptSelected: ViewOption;
    nodesOptAll: ViewOption;
    nodesOptOff: ViewOption;
    zoomIn: string;
    zoomOut: string;
    zoomReset: string;
    handTool: string;
    selectTool: string;
    deselectTooltip: string;
    brushErase: string;
    brushAdd: string;
    brushAuto: string;
    brushSizeTooltip: (px: number) => string;
    brushSizeTitle: string;
    clearMaskTooltip: string;
    viewSettings: {
      titleOriginal: string;
      titleMask: string;
      titleOverlayColor: string;
      titleOverlayBase: string;
      titleVector: string;
      cycleTooltip: (title: string, key: string) => string;
      origColor: ViewOption;
      origGray: ViewOption;
      maskBright: ViewOption;
      maskDark: ViewOption;
      maskOverlay: ViewOption;
      maskOverlayPink: ViewOption;
      maskOverlayAmber: ViewOption;
      maskOverlayRed: ViewOption;
      ovBlue: ViewOption;
      ovAmber: ViewOption;
      ovPink: ViewOption;
      ovBlack: ViewOption;
      baseOriginal: ViewOption;
      baseMaskBright: ViewOption;
      baseMaskDark: ViewOption;
      bgGrid: ViewOption;
      bgWhite: ViewOption;
      bgDark: ViewOption;
    };
  };
  replace: {
    titleDrop: string;
    titlePaste: string;
    body: string;
    bodyWithEdits: string;
    confirm: string;
    cancel: string;
    untitled: string;
    currentLabel: string;
  };
  export: {
    pdfTitle: string;
    pdfSubtitle: string;
    svgTitle: string;
    svgSubtitle: string;
    dxfTitle: string;
    dxfSubtitle: string;
    epsTitle: string;
    epsSubtitle: string;
    pngTitle: string;
    pngSubtitle: string;
    btnExport: string;
    allFormats: string;
  };
  landing: {
    kicker: string;
    heroTitleP1: string;
    heroTitleP2: string;
    heroDesc: string;
    heroCta: string;
    hoverHint: string;
    playKicker: string;
    playTitleP1: string;
    playTitleP2: string;
    playDesc: string;
    playBadge: string;
    playSimplifyLabel: string;
    playSimplifyDesc: (count: number) => string;
    playSmoothLabel: string;
    playSmoothDesc: string;
    playShowNodes: string;
    f1Kicker: string;
    f1Title: string;
    f1Desc: string;
    c1Title: string;
    c1Desc: string;
    c2Title: string;
    c2Desc: string;
    c3Title: string;
    c3Desc: string;
    c4Title: string;
    c4Desc: string;
    priceKicker: string;
    priceTitleP1: string;
    priceTitleP2: string;
    priceDesc: string;
    priceEquation: string;
    priceEquationSub: string;
    priceNoContract: string;
    priceSimple: string;
    priceB1: string;
    priceB2: string;
    priceB3: string;
    priceB4: string;
    payAnywayBtn: string;
    mathBadge: string;
    osoKicker: string;
    osoTitleP1: string;
    osoTitleP2: string;
    osoRole: string;
    osoText1: string;
    osoText2: string;
    osoQuote: string;
    openSourceBadge: string;
    f2Kicker: string;
    f2Title: string;
    svgDesc: string;
    pdfDesc: string;
    dxfDesc: string;
    epsDesc: string;
    pngDesc: string;
    shareKicker: string;
    shareTitleP1: string;
    shareTitleP2: string;
    shareDesc: string;
    shareB1: string;
    shareB2: string;
    shareB3: string;
    shareCta: string;
    shareCopied: string;
    shareYou: string;
    shareFriend: string;
    shareBurstTop: string;
    shareBurstBottom: string;
    footerText: string;
  };
  pwa: {
    updateReady: string;
    install: string;
    reload: string;
    dismiss: string;
  };
  legal: {
    link: string;
    backToTool: string;
    impressumTitle: string;
    responsible: string;
    contact: string;
    privacyTitle: string;
    privacyBody: string[];
    priceTitle: string;
    priceBody: string;
    licenseTitle: string;
    licenseBody: string;
  };
}

export const translations: Record<Locale, Translations> = {
  en: {
    brand: {
      name: 'Vector Oso',
      tagline: 'PNG & JPG > SVG',
      badge: '100% Free & Local',
      privacyTooltip: 'Click for local privacy details',
      githubTooltip: 'GitHub Source Repository'
    },
    status: {
      loading: 'Reading image …',
      processing: 'Vectorizing in background …',
      calculated: (c) => `${c} vector paths extracted.`,
      generating: (fmt) => `Generating .${fmt} …`,
      downloaded: (f) => `Downloaded: ${f}`,
      error: (msg) => `Error: ${msg}`,
      lastRunDied: (stage, size, contours) =>
        `Last time, this tab stopped during ${stage} at ${size}${contours ? ` with ${contours} paths` : ''} and never came back. If it keeps happening, this line is the thing to report.`
    },
    inspector: {
      title: 'Settings',
      reset: 'Reset',
      autoBtn: 'Auto',
      presetDefault: 'Just the file',
      presetDrawing: 'Pen plotter',
      presetLogo: 'Vinyl cutter',
      presetLaser: 'Laser / CNC',
      presetStencil: 'Stencil / print',
      presetEdited: 'edited',
      autoHintThreshold: 'Back to the black level worked out from your picture.',
      autoHintNeutral: 'Back to neutral. This is a fine adjustment on top of the black level, so its automatic setting is "leave alone".',
      autoHintDetail: 'Back to the size worked out from how thick your lines are.',
      autoHintShape: 'Back to the value for the chosen output.',
      histogram: {
        photo: 'as scanned',
        adjusted: 'adjusted',
        hint: 'Black level. Drag to move it, scroll to zoom, double-click to reset.',
        range: 'Tone range on show — drag the middle to move it, an end to zoom'
      },
      settingsHeader: 'MASK SETTINGS',
      vectorShapeHeader: 'VECTOR SHAPE',
      thresholdLabel: 'Threshold',
      thresholdTooltip: 'Separates dark stroke contours from background paper.',
      contrastLabel: 'Contrast',
      contrastTooltip: 'Amplifies edge sharpness between strokes and background.',
      brightnessLabel: 'Brightness',
      brightnessTooltip: 'Adjusts exposure before binarization.',
      softenLabel: 'Soften edges',
      softenTooltip:
        'Evens out grain and paper texture before the black-and-white decision is made. Without it, speckle flips pixels back and forth across the edge and leaves single pixels touching only at their corners, which trace badly and cannot be removed by "smallest detail".',
      softenOff: 'off',
      softenValue: (px) => `${px} px`,
      autoHintSoften: 'measured from the grain in your image',
      minDetailLabel: 'Smallest detail to keep',
      minDetailTooltip: 'Anything narrower than this is treated as paper grain rather than drawing. Cleans both ways: stray flecks of ink disappear, and pinholes inside the ink are filled in.',
      minDetailOff: 'keep all',
      minDetailValue: (px) => `${px} px across`,
      source: {
        sectionLabel: '00 · What we found in your image',
        kind: (k) =>
          ({
            line: 'Line drawing',
            solid: 'Large filled areas',
            photo: 'Photo or halftone',
            drawing: 'Drawing'
          })[k],
        strokeMeta: (px) => `${px} px stroke`,
        resample: (from, to) => `${from} → traced at ${to}`,
        resampleTitle:
          'Your image is larger than this device traces at, so it was scaled down first. Phones get the tighter limit, because a full-resolution trace is what runs them out of memory; everywhere else the limit only catches very large scans. SVG, PDF, EPS and DXF still come out at the size your full-resolution image would have given.',
        detailLabel: 'Detail',
        detailOption: (c) => ({ auto: 'auto', full: 'full', compact: 'compact' })[c],
        detailTitle: (c) =>
          ({
            auto: 'Pick the limit from the device. It is a guess from screen size, and a device that has already run out of memory mid-trace is held to the smaller one from then on.',
            full: 'Trace at full resolution whatever the device. Finer curves under magnification, more memory while working — this is the setting that can run a phone out of it.',
            compact:
              'Trace at the smaller limit everywhere. Coarser curves under magnification, and the safest on a phone.'
          })[c],
        detailDemoted: 'held to compact after a crash — pick full to try again',
        detailDemotedTitle:
          'A previous session ran out of memory partway through a trace on this device, so the smaller limit is being used. Choosing full clears that and tries full resolution again.',
        colourLabel: 'Colour',
        colourNoop: 'plain brightness worked best',
        colourFixed: (channel) =>
          ({ red: 'reading the red', green: 'reading the green', blue: 'reading the blue' })[channel],
        colourTitle: (channel, gain) =>
          `Reading the ${channel} channel instead of overall brightness — it separates your lines from the paper ${gain}× more cleanly. Click to turn off.`,
        lightingLabel: 'Lighting',
        lightingNoop: 'your paper is already even',
        lightingFixed: 'evening out the paper',
        lightingTitle: (levels) =>
          `One side of the paper is ${levels} shades darker than the other. Evening that out so a single threshold works everywhere. Click to turn off.`,
        levelsLabel: 'Levels',
        levelsNoop: 'already black to white',
        levelsFixed: (factor) => `spread ${factor}× to fill black-to-white`,
        levelsTitle: (factor) =>
          `Your photo never reached full black or full white, so it was spread ${factor}× to use the whole range before anything else ran. This is why Contrast starts at 100 — the stretch already spent that range.`,
        offSuffix: 'off'
      },
      modeLabel: 'Tracing Mode',
      modeTooltip: 'Follow the pixel edges exactly, or read between them for smoother curves.',
      modePixel: 'Pixel Exact',
      modeSubpixel: 'Subpixel',
      modePixelHint: 'Pixel exact follows the original bitmap pixels with zero smoothing.',
      modeSubpixelHint: 'Subpixel performs gradient interpolation for organic, flowing curves.',
      edgeSmoothLabel: 'Edge Smoothing',
      edgeSmoothTooltip: 'Rounds off the jagged staircase left by the pixel grid, without shrinking the shape.',
      simplifyLabel: 'Simplify Curves',
      simplifyHint: 'How far the traced line may wander from your drawing, on the finished piece. Larger means fewer points — a smaller file that plots and cuts faster.'
    },
    canvas: {
      viewOriginal: 'Original',
      viewMask: 'Mask',
      viewOverlay: 'Overlay',
      viewVector: 'Vector',
      viewOriginalTip: '1: Original image (press again or Q for colour mode)',
      viewMaskTip: '2: Binarised mask (press again or Q for display mode)',
      viewOverlayTip: '3: Overlay (press again or Q for colours, W for the layer underneath)',
      viewVectorTip: '4: Traced Bezier paths (press again or Q for backgrounds)',
      brush: 'Brush (B)',
      lasso: 'Lasso (L)',
      addMode: 'Add (+)',
      removeMode: 'Remove (−)',
      brushSize: 'Size',
      undo: 'Undo (⌘Z)',
      redo: 'Redo (⇧⌘Z)',
      resetMask: 'Reset Mask',
      lassoHint: 'Lasso: Draw a loop around areas to add/remove from the mask',
      lassoInsideTooltip: 'Act on what you loop around (O to switch)',
      lassoOutsideTooltip:
        'Act on everything outside the loop — with Erase, that keeps only the shape you drew around (O to switch)',
      lassoOutsideSuffix: 'outside the loop',
      brushHint: 'Brush: Paint over areas to add/remove from the mask',
      fit: 'Fit',
      fitTooltip: 'Fit: show the whole image (0, F or Cmd/Ctrl+0)',
      bgGrid: 'Grid',
      bgWhite: 'White',
      bgDark: 'Dark',
      changeImage: 'Change image',
      dropTitle: 'Drop image here or click to browse',
      dropSubtitle: 'PNG, JPG or WEBP · 100% client-side in browser',
      uploadBtn: 'Select Image',
      tracingStatus: 'Vectorizing in background …',
      traceFinishing: 'Finishing up',
      perfCount: (nodes, shapes) =>
        `${nodes.toLocaleString()} nodes in ${shapes.toLocaleString()} shapes`,
      perfHint: 'High node and shape count may impact performance.',
      perfReduce: 'Reduce detail',
      perfDismiss: 'Dismiss',
      traceStage: (stage) =>
        ({
          edges: 'Finding the edges',
          joining: 'Joining them into outlines',
          orienting: 'Working out the holes',
          curves: 'Smoothing into curves'
        })[stage],
      pathsCount: (c) => `${c} paths`,
      nodesCount: (c) => `${c} nodes`,
      pathRef: (num) => `#${num}`,
      pathSelected: (num) => `Path #${num} selected`,
      pathsSelected: (count) => `${count} paths selected`,
      nodesModeSelected: 'Select',
      nodesModeAll: 'All',
      nodesModeOff: 'Off',
      nodesTooltipSelected: 'Bézier Nodes: Active on Selection (Key: N for All)',
      nodesTooltipAll: 'Bézier Nodes: All Paths Active (Key: N to Turn Off)',
      nodesTooltipOff: 'Bézier Nodes: Disabled (Key: N to Enable)',
      nodesTriggerTooltip: (mode) => `Bézier Nodes: ${mode} (Press N to cycle)`,
      nodesTitle: 'Bézier inspection',
      nodesCapped: (drawn) =>
        `Only the first ${drawn.toLocaleString('en')} nodes on screen are drawn. Zoom in to see the rest.`,
      nodesNoHandles: (limit) =>
        `Tangent handles are hidden above ${limit.toLocaleString('en')} nodes in view.`,
      nodesBelowZoom: (pct) => `Nodes appear from ${pct}% zoom.`,
      nodesOptSelected: { label: 'Selection (focus)', hint: 'Nodes of the selected path only (recommended)' },
      nodesOptAll: { label: 'All nodes', hint: 'Show every anchor point and tangent' },
      nodesOptOff: { label: 'Hidden', hint: 'Clean vector preview, no markers' },
      zoomIn: 'Zoom in (scroll or ⌘+)',
      zoomOut: 'Zoom out (scroll or ⌘−)',
      zoomReset: 'Reset to 100%',
      handTool: 'Pan / Hand tool (H or hold Space)',
      selectTool: 'Select & inspect paths (V)',
      deselectTooltip: 'Deselect (Escape or ⌘D)',
      brushErase: 'Erase / Remove from mask (X)',
      brushAdd: 'Add / Fill in mask (X)',
      brushAuto: 'Auto: Restore Otsu threshold (X)',
      brushSizeTooltip: (px) => `Brush size: ${px}px ([ / ] or , / .)`,
      brushSizeTitle: 'Brush size',
      clearMaskTooltip: 'Discard all manual mask edits',
      viewSettings: {
        titleOriginal: 'Original: colour mode',
        titleMask: 'Mask: display mode',
        titleOverlayColor: 'Overlay: vector colour',
        titleOverlayBase: 'Overlay: layer underneath',
        titleVector: 'Vector: background',
        cycleTooltip: (title, key) => `${title} (press ${key} to cycle)`,
        origColor: { label: 'True colour (RGB)', hint: 'The photo as shot' },
        origGray: { label: 'Greyscale (B/W)', hint: 'Judge tone without colour' },
        maskBright: { label: 'Light (B/W)', hint: 'Black on white' },
        maskDark: { label: 'Dark (B/W)', hint: 'White on dark grey' },
        maskOverlay: { label: 'Overlay blue', hint: 'Photoshop quick mask' },
        maskOverlayPink: { label: 'Overlay pink', hint: 'Vivid magenta' },
        maskOverlayAmber: { label: 'Overlay amber', hint: 'Warm orange' },
        maskOverlayRed: { label: 'Overlay rubylith', hint: 'Classic screen-print red' },
        ovBlue: { label: 'Default blue', hint: 'Strong cyan blue' },
        ovAmber: { label: 'Amber / gold', hint: 'High contrast on dark photos' },
        ovPink: { label: 'Magenta / pink', hint: 'High contrast on foliage and green' },
        ovBlack: { label: 'Solid black', hint: 'Full silhouette over the original' },
        baseOriginal: { label: 'Original image', hint: 'Check the trace against the photo' },
        baseMaskBright: { label: 'Mask, light', hint: 'Vectors over black on white' },
        baseMaskDark: { label: 'Mask, dark', hint: 'Vectors over white on dark grey' },
        bgGrid: { label: 'Checkerboard', hint: 'Transparency grid' },
        bgWhite: { label: 'Pure white', hint: 'White background' },
        bgDark: { label: 'Dark studio', hint: 'Dark grey background' }
      }
    },
    replace: {
      titleDrop: 'Replace the current image?',
      titlePaste: 'Paste this image?',
      body: 'Your current drawing and its settings will be swapped for this one.',
      bodyWithEdits: 'Your current drawing will be swapped for this one — including the mask you painted, which cannot be undone afterwards.',
      confirm: 'Replace',
      cancel: 'Keep current',
      untitled: 'Pasted image',
      currentLabel: 'current'
    },
    export: {
      svgTitle: 'SVG · Vector',
      svgSubtitle: '.svg',
      pdfTitle: 'PDF',
      pdfSubtitle: '.pdf',
      pngTitle: 'PNG',
      pngSubtitle: '.png',
      epsTitle: 'EPS',
      epsSubtitle: '.eps',
      dxfTitle: 'DXF',
      dxfSubtitle: '.dxf',
      btnExport: 'Export vector file',
      allFormats: 'Show all formats (hover or click)'
    },
    landing: {
      kicker: 'Vectorize Images · Directly in your Browser',
      heroTitleP1: 'From pixels to',
      heroTitleP2: 'paths.',
      heroDesc: 'Vector Oso converts photos, logos, sketches, and handwriting into crisp vector contours. Compare raster and vector previews in real time and export clean Bézier paths to PDF, SVG, EPS, or DXF.',
      heroCta: 'Open tool',
      hoverHint: 'Hover over “paths” to watch pixels turn into smooth curves.',
      playKicker: 'Live Preview',
      playTitleP1: 'Clean curves.',
      playTitleP2: 'Total control.',
      playDesc: 'From ragged pixel steps to smooth vector contours — adjust smoothing in real time and see anchor nodes optimize instantly.',
      playBadge: 'Anchor points:',
      playSimplifyLabel: 'Path Simplification',
      playSimplifyDesc: (count) => `Reduces redundant anchor points from ${count} down to 6 key nodes.`,
      playSmoothLabel: 'Curve Curvature (Smoothing)',
      playSmoothDesc: 'Generates fluid cubic Bézier arcs without sharp artifacts.',
      playShowNodes: 'Show anchor points & tangents',
      f1Kicker: '01 · Workshop Features',
      f1Title: 'Built for real production.',
      f1Desc: 'No Illustrator subscription and no paywalls. All essential vectorization tools remain 100% free.',
      c1Title: 'Subpixel Marching Squares',
      c1Desc: 'Extracts isosurfaces using linear subpixel interpolation for smooth, natural curves.',
      c2Title: 'Area-Preserving Smoothing',
      c2Desc: 'Uses Shoelace area normalization to prevent delicate cursive strokes and closed loops from shrinking.',
      c3Title: 'Laser & CNC DXF',
      c3Desc: 'Outputs standard-compliant closed LWPOLYLINE contours on dedicated CAD layers for LightBurn, Glowforge, and CNCs.',
      c4Title: '100% Client-Side Privacy',
      c4Desc: 'Your images never leave your device. All computations run locally in Web Workers on your CPU.',
      priceKicker: '02 · No credits, no contract',
      priceTitleP1: '0€ =',
      priceTitleP2: 'Unlimited.',
      priceDesc: 'Upload images, tweak parameters in real time, refine vectors, and export all 5 formats with zero download limits.',
      priceEquation: '0 cents per download.',
      priceEquationSub: 'Simple, right?',
      priceNoContract: 'NO CONTRACT',
      priceSimple: 'We keep it simple.',
      priceB1: '100% free client-side processing in your browser',
      priceB2: 'Free lossless export for PDF, PNG, SVG, EPS and DXF',
      priceB3: 'No account, no credit card, no subscription',
      priceB4: 'Runs entirely on your local machine using Web Workers',
      payAnywayBtn: 'Pay 10€ anyway',
      mathBadge: '100% FREE & OPEN SOURCE',
      osoKicker: '03 · But why?',
      osoTitleP1: 'Built with',
      osoTitleP2: 'conviction.',
      osoRole: 'Oso · Chief Vibe Officer',
      osoText1: 'Design and vectorization shouldn’t be locked behind artificial paywalls or overpriced subscriptions.',
      osoText2:
        'Vector Oso was built on a simple premise: great creative tools and intuitive software shouldn’t be luxury goods, but open and accessible to everyone. The world is expensive enough.',
      osoQuote: '“Lose the pixels. Keep your money.”',
      openSourceBadge: 'Open Source · No Paywalls',
      f2Kicker: '04 · Export Formats',
      f2Title: 'One image in. Five formats out.',
      svgDesc: 'Universal vector standard for Web, Figma, Inkscape, vinyl cutters, and plotters.',
      pdfDesc: 'Robust print-ready vector standard with lossless resolution scaling.',
      dxfDesc: 'Closed CAD polylines for laser cutters, CNC mills, and drafting software.',
      epsDesc: 'PostScript Level 3 vector format for traditional prepress and print workflows.',
      pngDesc: 'Cleaned black & white bitmap with transparent alpha background.',
      shareKicker: '05 · Tell your friends',
      shareTitleP1: 'One link.',
      shareTitleP2: 'No catch.',
      shareDesc:
        'No referral scheme, no reward, nothing to sign up for. If it was useful to you, pass the link on.',
      shareB1: 'No account and nothing to install — the link simply works',
      shareB2: 'Runs on their machine, not on a server of ours',
      shareB3: 'Free for them too, in every format, with no download limit',
      shareCta: 'Copy link',
      shareCopied: 'Copied',
      shareYou: 'YOU',
      shareFriend: 'FRIEND',
      shareBurstTop: 'THAT MAKES',
      shareBurstBottom: 'HAPPY PLOTTER',
      footerText: 'Free & open-source in-browser vectorizer.'
    },
    pwa: {
      updateReady: 'A new version is available.',
      install: 'Install app',
      reload: 'Reload',
      dismiss: 'Dismiss'
    },
    legal: {
      link: 'Legal notice',
      backToTool: 'Back to the tool',
      impressumTitle: 'Legal notice',
      responsible: 'Responsible for this site',
      contact: 'Contact',
      privacyTitle: 'Privacy',
      privacyBody: [
        'Vector Oso processes images entirely inside your browser. Nothing you open, adjust or export is uploaded anywhere. There is no analytics, no tracking and no cookies.',
        'The server delivering this page may keep the usual request data — IP address, time, requested file — in its log for a short period, to operate and secure the service.',
        'Your language choice is stored in your own browser via localStorage. Clearing site data removes it.'
      ],
      priceTitle: 'About the price',
      priceBody:
        'Vector Oso is free and stays free. The “pay anyway” button is a joke that happens to work — it opens a voluntary donation page. Nothing is sold here, no contract is concluded, and paying unlocks nothing.',
      licenseTitle: 'Licence',
      licenseBody:
        'Vector Oso is open source under Apache-2.0. You may use, study, modify, distribute and sublicense it, including commercially, provided you retain the licence and applicable notices. The name and logo are not covered by this licence.'
    }
  },
  de: {
    brand: {
      name: 'Vector Oso',
      tagline: 'PNG & JPG > SVG',
      badge: '100% Kostenlos & Lokal',
      privacyTooltip: 'Klick für Details zur lokalen Privatsphäre',
      githubTooltip: 'GitHub Quellcode-Repository'
    },
    status: {
      loading: 'Bild wird gelesen …',
      processing: 'Vektorisierung läuft …',
      calculated: (c) => `${c} Vektorpfade berechnet.`,
      generating: (fmt) => `.${fmt} wird generiert …`,
      downloaded: (f) => `Download: ${f}`,
      error: (msg) => `Fehler: ${msg}`,
      lastRunDied: (stage, size, contours) =>
        `Beim letzten Mal blieb dieser Tab in Phase ${stage} bei ${size}${contours ? ` mit ${contours} Pfaden` : ''} stehen und kam nicht zurück. Falls das öfter passiert: genau diese Zeile melden.`
    },
    inspector: {
      title: 'Einstellungen',
      reset: 'Zurücksetzen',
      autoBtn: 'Auto',
      presetDefault: 'Nur die Datei',
      presetDrawing: 'Stiftplotter',
      presetLogo: 'Folienplotter',
      presetLaser: 'Laser / CNC',
      presetStencil: 'Schablone / Druck',
      presetEdited: 'angepasst',
      autoHintThreshold: 'Zurück zum aus deinem Bild ermittelten Schwarzwert.',
      autoHintNeutral: 'Zurück auf neutral. Das ist eine Feinjustierung über dem Schwarzwert – automatisch heißt hier "unverändert lassen".',
      autoHintDetail: 'Zurück zur Größe, die aus deiner Strichstärke ermittelt wurde.',
      autoHintShape: 'Zurück zum Wert für die gewählte Ausgabe.',
      histogram: {
        photo: 'wie gescannt',
        adjusted: 'angepasst',
        hint: 'Schwarzwert. Ziehen zum Verschieben, scrollen zum Zoomen, Doppelklick setzt zurück.',
        range: 'Sichtbarer Tonwertbereich – Mitte ziehen zum Verschieben, Ende zum Zoomen'
      },
      settingsHeader: 'MASKEN-EINSTELLUNGEN',
      vectorShapeHeader: 'VEKTORFORM',
      thresholdLabel: 'Schwellenwert',
      thresholdTooltip: 'Trennt dunkle Linien präzise vom Hintergrund.',
      contrastLabel: 'Kontrast',
      contrastTooltip: 'Erhöht die Kantenschärfe zwischen Strichen und Hintergrund.',
      brightnessLabel: 'Helligkeit',
      brightnessTooltip: 'Passt die Belichtung vor der Binarisierung an.',
      softenLabel: 'Kanten weichzeichnen',
      softenTooltip:
        'Beruhigt Korn und Papierstruktur, bevor über Schwarz und Weiß entschieden wird. Ohne das kippen einzelne Pixel an der Kante hin und her und berühren sich nur noch an den Ecken – das lässt sich schlecht vektorisieren und auch mit „Kleinstes Detail“ nicht entfernen.',
      softenOff: 'aus',
      softenValue: (px) => `${px} px`,
      autoHintSoften: 'aus dem Korn deines Bildes gemessen',
      minDetailLabel: 'Kleinstes Detail',
      minDetailTooltip: 'Alles Schmalere gilt als Papierkorn und nicht als Zeichnung. Wirkt in beide Richtungen: einzelne Tintenflecken verschwinden, Löcher in der Fläche werden gefüllt.',
      minDetailOff: 'alles behalten',
      minDetailValue: (px) => `${px} px breit`,
      source: {
        sectionLabel: '00 · Was wir in deinem Bild gefunden haben',
        kind: (k) =>
          ({
            line: 'Strichzeichnung',
            solid: 'Große Flächen',
            photo: 'Foto oder Halbton',
            drawing: 'Zeichnung'
          })[k],
        strokeMeta: (px) => `${px} px Strich`,
        resample: (from, to) => `${from} → nachgezeichnet mit ${to}`,
        resampleTitle:
          'Dein Bild ist größer, als dieses Gerät nachzeichnet, deshalb wurde es vorher verkleinert. Handys bekommen die engere Grenze, weil ihnen bei voller Auflösung der Speicher ausgeht; überall sonst greift sie erst bei sehr großen Scans. SVG, PDF, EPS und DXF kommen weiterhin in der Größe heraus, die dein Bild in voller Auflösung ergeben hätte.',
        detailLabel: 'Detail',
        detailOption: (c) => ({ auto: 'auto', full: 'voll', compact: 'sparsam' })[c],
        detailTitle: (c) =>
          ({
            auto: 'Grenze nach Gerät wählen. Das ist eine Schätzung anhand der Bildschirmgröße; ein Gerät, dem beim Nachzeichnen schon einmal der Speicher ausging, bleibt danach bei der kleineren.',
            full: 'Immer in voller Auflösung nachzeichnen. Feinere Kurven beim Hineinzoomen, mehr Speicher — genau die Einstellung, an der ein Handy scheitern kann.',
            compact: 'Überall die kleinere Grenze. Gröbere Kurven beim Hineinzoomen, auf dem Handy am sichersten.'
          })[c],
        detailDemoted: 'nach einem Absturz auf sparsam — für einen neuen Versuch „voll" wählen',
        detailDemotedTitle:
          'Einer früheren Sitzung ging auf diesem Gerät mitten im Nachzeichnen der Speicher aus, deshalb gilt die kleinere Grenze. „Voll" setzt das zurück und versucht es erneut.',
        colourLabel: 'Farbe',
        colourNoop: 'reine Helligkeit war am besten',
        colourFixed: (channel) =>
          ({ red: 'liest den Rotkanal', green: 'liest den Grünkanal', blue: 'liest den Blaukanal' })[channel],
        colourTitle: (channel, gain) =>
          `Liest den ${{ red: 'Rot', green: 'Grün', blue: 'Blau' }[channel]}kanal statt der Gesamthelligkeit – er trennt Strich und Papier ${gain}× klarer. Klicken zum Ausschalten.`,
        lightingLabel: 'Licht',
        lightingNoop: 'dein Papier ist gleichmäßig',
        lightingFixed: 'gleicht das Papier aus',
        lightingTitle: (levels) =>
          `Eine Seite des Papiers ist ${levels} Stufen dunkler als die andere. Das wird ausgeglichen, damit ein einziger Schwellenwert überall passt. Klicken zum Ausschalten.`,
        levelsLabel: 'Tonwerte',
        levelsNoop: 'schon von Schwarz bis Weiß',
        levelsFixed: (factor) => `${factor}× gespreizt auf Schwarz bis Weiß`,
        levelsTitle: (factor) =>
          `Dein Foto erreichte weder volles Schwarz noch volles Weiß und wurde deshalb ${factor}× gespreizt, bevor irgendetwas anderes lief. Genau darum startet der Kontrast bei 100 – die Spreizung hat den Spielraum schon verbraucht.`,
        offSuffix: 'aus'
      },
      modeLabel: 'Abtastmodus',
      modeTooltip: 'Den Pixelkanten exakt folgen – oder dazwischen lesen, für weichere Kurven.',
      modePixel: 'Pixelgenau',
      modeSubpixel: 'Subpixel',
      modePixelHint: 'Pixelgenau folgt exakt den Kanten der Original-Rasterpixel.',
      modeSubpixelHint: 'Subpixel interpoliert Kanten für weiche Bézier-Rundungen.',
      edgeSmoothLabel: 'Kantenglättung',
      edgeSmoothTooltip: 'Glättet die Treppenstufen des Pixelrasters, ohne die Form zu verkleinern.',
      simplifyLabel: 'Kurven vereinfachen',
      simplifyHint: 'Wie weit die gezeichnete Linie am fertigen Stück von deiner Vorlage abweichen darf. Größer heißt weniger Punkte – kleinere Datei, die schneller plottet und schneidet.'
    },
    canvas: {
      viewOriginal: 'Original',
      viewMask: 'Maske',
      viewOverlay: 'Overlay',
      viewVector: 'Vektor',
      viewOriginalTip: '1: Originalbild (Wiederholen oder Q für Farbmodus)',
      viewMaskTip: '2: Binarisierte Maske (Wiederholen oder Q für Darstellungsmodus)',
      viewOverlayTip: '3: Overlay (Wiederholen oder Q für Farben, W für die Ebene darunter)',
      viewVectorTip: '4: Vektorisierte Bézier-Pfade (Wiederholen oder Q für Hintergründe)',
      brush: 'Pinsel (B)',
      lasso: 'Lasso (L)',
      addMode: 'Hinzufügen (+)',
      removeMode: 'Entfernen (−)',
      brushSize: 'Größe',
      undo: 'Rückgängig (⌘Z)',
      redo: 'Wiederholen (⇧⌘Z)',
      resetMask: 'Maske zurücksetzen',
      lassoHint: 'Lasso: Schleife um Bereiche ziehen, um sie zur Maske hinzuzufügen/zu entfernen',
      lassoInsideTooltip: 'Wirkt auf das, was du umschließt (O zum Wechseln)',
      lassoOutsideTooltip:
        'Wirkt auf alles außerhalb der Schleife — mit Radieren bleibt nur die umschlossene Form übrig (O zum Wechseln)',
      lassoOutsideSuffix: 'außerhalb der Schleife',
      brushHint: 'Pinsel: Über Bereiche malen, um sie zur Maske hinzuzufügen/zu entfernen',
      fit: 'Einpassen',
      fitTooltip: 'Einpassen: Gesamtes Bild zeigen (Taste: 0, F oder Cmd/Strg+0)',
      bgGrid: 'Raster',
      bgWhite: 'Weiß',
      bgDark: 'Dunkel',
      changeImage: 'Bild wechseln',
      dropTitle: 'Bild hier ablegen oder auswählen',
      dropSubtitle: 'PNG, JPG oder WEBP · Lokale Verarbeitung im Browser',
      uploadBtn: 'Bild auswählen',
      tracingStatus: 'Vektorisierung läuft …',
      traceFinishing: 'Wird fertiggestellt',
      perfCount: (nodes, shapes) =>
        `${nodes.toLocaleString()} Punkte in ${shapes.toLocaleString()} Formen`,
      perfHint: 'Hohe Punkt- und Formenanzahl kann die Leistung beeinträchtigen.',
      perfReduce: 'Weniger Details',
      perfDismiss: 'Schließen',
      traceStage: (stage) =>
        ({
          edges: 'Kanten finden',
          joining: 'Zu Umrissen verbinden',
          orienting: 'Löcher bestimmen',
          curves: 'Zu Kurven glätten'
        })[stage],
      pathsCount: (c) => `${c} Pfade`,
      nodesCount: (c) => `${c} Nodes`,
      pathRef: (num) => `#${num}`,
      pathSelected: (num) => `Pfad #${num} ausgewählt`,
      pathsSelected: (count) => `${count} Pfade ausgewählt`,
      nodesModeSelected: 'Auswahl',
      nodesModeAll: 'Alle',
      nodesModeOff: 'Aus',
      nodesTooltipSelected: 'Bézier-Punkte: Bei Auswahl aktiv (Taste: N für Alle)',
      nodesTooltipAll: 'Bézier-Punkte: Alle Pfade aktiv (Taste: N zum Ausschalten)',
      nodesTooltipOff: 'Bézier-Punkte: Deaktiviert (Taste: N zum Aktivieren)',
      nodesTriggerTooltip: (mode) => `Bézier-Punkte: ${mode} (Taste: N zum Durchschalten)`,
      nodesTitle: 'Bézier-Inspektion',
      nodesCapped: (drawn) =>
        `Es werden nur die ersten ${drawn.toLocaleString('de')} Nodes im Bild gezeichnet. Zum Rest hineinzoomen.`,
      nodesNoHandles: (limit) =>
        `Tangenten werden ab ${limit.toLocaleString('de')} Nodes im Bild ausgeblendet.`,
      nodesBelowZoom: (pct) => `Nodes erscheinen ab ${pct}% Zoom.`,
      nodesOptSelected: { label: 'Auswahl (Fokus)', hint: 'Nur Nodes des markierten Pfads anzeigen (Empfohlen)' },
      nodesOptAll: { label: 'Alle Nodes', hint: 'Alle Ankerpunkte & Tangenten einblenden' },
      nodesOptOff: { label: 'Ausblenden', hint: 'Reine Vektor-Vorschau ohne Marker' },
      zoomIn: 'Vergrößern (Mausrad oder ⌘+)',
      zoomOut: 'Verkleinern (Mausrad oder ⌘−)',
      zoomReset: 'Auf 100% zurücksetzen',
      handTool: 'Verschieben / Hand-Werkzeug (H oder Leertaste halten)',
      selectTool: 'Pfade auswählen & inspizieren (V)',
      deselectTooltip: 'Auswahl aufheben (Escape oder ⌘D)',
      brushErase: 'Entfernen / Radieren (Taste: X)',
      brushAdd: 'Hinzufügen / Füllen (Taste: X)',
      brushAuto: 'Auto: Otsu-Schwellenwert wiederherstellen (Taste: X)',
      brushSizeTooltip: (px) => `Pinselgröße: ${px}px (Tasten: [ / ] oder , / .)`,
      brushSizeTitle: 'Pinselgröße',
      clearMaskTooltip: 'Alle manuellen Masken-Retuschen verwerfen',
      viewSettings: {
        titleOriginal: 'Original: Farbmodus',
        titleMask: 'Maske: Darstellungsmodus',
        titleOverlayColor: 'Overlay: Vektor-Farbe',
        titleOverlayBase: 'Overlay: Ebene darunter',
        titleVector: 'Vektor: Hintergrund',
        cycleTooltip: (title, key) => `${title} (Taste: ${key} zum Weiterschalten)`,
        origColor: { label: 'Echtfarben (RGB)', hint: 'Das Foto wie aufgenommen' },
        origGray: { label: 'Graustufen (S/W)', hint: 'Tonwerte ohne Farbe beurteilen' },
        maskBright: { label: 'Hell (S/W)', hint: 'Schwarz auf Weiß' },
        maskDark: { label: 'Dunkel (S/W)', hint: 'Weiß auf Dunkelgrau' },
        maskOverlay: { label: 'Overlay Blau', hint: 'Photoshop Quick Mask' },
        maskOverlayPink: { label: 'Overlay Pink', hint: 'Kräftiges Magenta' },
        maskOverlayAmber: { label: 'Overlay Bernstein', hint: 'Warmes Orange' },
        maskOverlayRed: { label: 'Overlay Rubylith', hint: 'Klassisches Siebdruck-Rot' },
        ovBlue: { label: 'Standard Blau', hint: 'Kräftiges Cyan-Blau' },
        ovAmber: { label: 'Bernstein / Gold', hint: 'Hoher Kontrast zu dunklen Fotos' },
        ovPink: { label: 'Magenta / Pink', hint: 'Hoher Kontrast zu Natur & Grün' },
        ovBlack: { label: 'Schwarz deckend', hint: '100% Silhouette über Original' },
        baseOriginal: { label: 'Originalbild', hint: 'Trace gegen das Foto prüfen' },
        baseMaskBright: { label: 'Maske, hell', hint: 'Vektoren über Schwarz auf Weiß' },
        baseMaskDark: { label: 'Maske, dunkel', hint: 'Vektoren über Weiß auf Dunkelgrau' },
        bgGrid: { label: 'Schachbrett-Raster', hint: 'Transparenz-Gitter' },
        bgWhite: { label: 'Reines Weiß', hint: 'Weißer Hintergrund' },
        bgDark: { label: 'Dunkles Studio', hint: 'Dunkelgrauer Hintergrund' }
      }
    },
    replace: {
      titleDrop: 'Aktuelles Bild ersetzen?',
      titlePaste: 'Dieses Bild einfügen?',
      body: 'Deine aktuelle Zeichnung und ihre Einstellungen werden dadurch ersetzt.',
      bodyWithEdits: 'Deine aktuelle Zeichnung wird ersetzt – samt der Maske, die du gemalt hast. Das lässt sich danach nicht rückgängig machen.',
      confirm: 'Ersetzen',
      cancel: 'Behalten',
      untitled: 'Eingefügtes Bild',
      currentLabel: 'aktuell'
    },
    export: {
      svgTitle: 'SVG · Vektor',
      svgSubtitle: '.svg',
      pdfTitle: 'PDF',
      pdfSubtitle: '.pdf',
      pngTitle: 'PNG',
      pngSubtitle: '.png',
      epsTitle: 'EPS',
      epsSubtitle: '.eps',
      dxfTitle: 'DXF',
      dxfSubtitle: '.dxf',
      btnExport: 'Vektordatei exportieren',
      allFormats: 'Alle Formate anzeigen (Hover oder Klick)'
    },
    landing: {
      kicker: 'Bilder vektorisieren · Direkt im Browser',
      heroTitleP1: 'Von Pixeln zu',
      heroTitleP2: 'Pfaden.',
      heroDesc: 'Vector Oso verwandelt Fotos, Logos, Skizzen und Handschriften in gestochen scharfe Vektoren. Vergleiche Raster und Kontur in Echtzeit und exportiere echte Bézier-Pfade als PDF, SVG, EPS oder DXF.',
      heroCta: 'Zum Werkzeug',
      hoverHint: 'Fahre mit der Maus über „Pfaden“, um die Kurvenglättung zu sehen.',
      playKicker: 'Live-Vorschau',
      playTitleP1: 'Saubere Kurven.',
      playTitleP2: 'Volle Kontrolle.',
      playDesc: 'Von unruhigen Pixelkanten zu perfekten Vektorkonturen – passe die Glättung in Echtzeit an und sieh sofort, wie Ankerpunkte optimiert werden.',
      playBadge: 'Ankerpunkte:',
      playSimplifyLabel: 'Pfad-Vereinfachung',
      playSimplifyDesc: (count) => `Reduziert überflüssige Ankerpunkte von ${count} auf bis zu 6 Kurvenpunkte.`,
      playSmoothLabel: 'Kurvenschwung (Glättung)',
      playSmoothDesc: 'Erzeugt fließende kubische Bézier-Bögen ohne spitze Ecken.',
      playShowNodes: 'Ankerpunkte & Tangenten anzeigen',
      f1Kicker: '01 · Werkstatt-Features',
      f1Title: 'Gebaut für echte Produktion.',
      f1Desc: 'Kein Illustrator-Abo und keine versteckten Gebühren. Alle essenziellen Werkzeuge bleiben kostenlos.',
      c1Title: 'Subpixel Marching Squares',
      c1Desc: 'Erfasst Kanten mit stufenloser linearer Gradienten-Interpolation für organisch geschwungene Rundungen.',
      c2Title: 'Flächenerhaltende Glättung',
      c2Desc: 'Verhindert durch automatische Shoelace-Flächenkorrektur, dass feine Handschriften beim Glätten schrumpfen.',
      c3Title: 'Laser & Plotter DXF',
      c3Desc: 'Erzeugt standardkonforme geschlossene LWPOLYLINE-Konturen auf eigenem CAD-Layer für LightBurn, Glowforge und CNC.',
      c4Title: '100% Client-Side Privacy',
      c4Desc: 'Deine Bilder verlassen niemals deinen Rechner. Alle Berechnungen laufen komplett lokal in Web Workern auf deiner CPU.',
      priceKicker: '02 · Keine Credits, kein Vertrag',
      priceTitleP1: '0€ =',
      priceTitleP2: 'Unbegrenzt.',
      priceDesc: 'Bilder hochladen, Parameter in Echtzeit testen, Vektoren verfeinern und ohne Download-Limit alle 5 Formate exportieren.',
      priceEquation: '0 Cent pro Download.',
      priceEquationSub: 'Einfach, oder?',
      priceNoContract: 'OHNE VERTRAG',
      priceSimple: 'Wir halten es einfach.',
      priceB1: '100% kostenlose Verarbeitung im Browser',
      priceB2: 'Kostenloser Export für PDF, PNG, SVG, EPS und DXF',
      priceB3: 'Kein Account, keine Kreditkarte, kein Abo',
      priceB4: 'Läuft komplett lokal auf deiner eigenen CPU',
      payAnywayBtn: 'Trotzdem 10€ bezahlen',
      mathBadge: 'KOSTENLOS & OPEN SOURCE',
      osoKicker: '03 · Aber warum?',
      osoTitleP1: 'Gebaut aus',
      osoTitleP2: 'Überzeugung.',
      osoRole: 'Oso · Chief Vibe Officer',
      osoText1: 'Design und Vektorisierung müssen nicht hinter künstlichen Paywalls oder überteuerten Abos versteckt werden.',
      osoText2:
        'Vector Oso basiert auf einer einfachen Überzeugung: Gute Kreativwerkzeuge und intuitive Software sollten kein Luxusgut sein, sondern für alle frei zugänglich. Die Welt ist teuer genug.',
      osoQuote: '„Verliere die Pixel. Behalte dein Geld.“',
      openSourceBadge: 'Open Source · Ohne Paywalls',
      f2Kicker: '04 · Exportformate',
      f2Title: 'Ein Bild rein. Fünf Formate raus.',
      svgDesc: 'Universeller Standard für Web, Figma, Inkscape, Schneidplotter und moderne Workflows.',
      pdfDesc: 'Robuster Vektor-Standard für Druck, Übergabe und verlustfreie Skalierung.',
      dxfDesc: 'Geschlossene Vektorkonturen für Lasercutter, CNC-Fräsen und CAD-Programme.',
      epsDesc: 'PostScript-Standard für klassische Druckvorstufen und traditionelle Grafikprogramme.',
      pngDesc: 'Das bereinigte Schwarz-Weiß-Ergebnis als transparentes 1-Bit-Rasterbild.',
      shareKicker: '05 · Weitersagen',
      shareTitleP1: 'Ein Link.',
      shareTitleP2: 'Kein Haken.',
      shareDesc:
        'Kein Empfehlungsprogramm, keine Belohnung, keine Anmeldung. Wenn es dir geholfen hat, gib den Link weiter.',
      shareB1: 'Kein Konto, nichts zu installieren — der Link funktioniert einfach',
      shareB2: 'Läuft auf ihrem Rechner, nicht auf einem Server von uns',
      shareB3: 'Für sie genauso kostenlos, in jedem Format, ohne Download-Limit',
      shareCta: 'Link kopieren',
      shareCopied: 'Kopiert',
      shareYou: 'DU',
      shareFriend: 'FREUND',
      shareBurstTop: 'DAS MACHT',
      shareBurstBottom: 'GLÜCKLICHEN PLOTTER',
      footerText: 'Kostenloser Open-Source Vektorisierer für den Browser.'
    },
    pwa: {
      updateReady: 'Eine neue Version ist verfügbar.',
      install: 'App installieren',
      reload: 'Neu laden',
      dismiss: 'Schließen'
    },
    legal: {
      link: 'Impressum',
      backToTool: 'Zurück zum Tool',
      impressumTitle: 'Impressum',
      responsible: 'Angaben gemäß § 5 DDG',
      contact: 'Kontakt',
      privacyTitle: 'Datenschutz',
      privacyBody: [
        'Vector Oso verarbeitet Bilder vollständig in deinem Browser. Nichts, was du öffnest, einstellst oder exportierst, wird irgendwohin hochgeladen. Es gibt keine Analyse, kein Tracking und keine Cookies.',
        'Der Server, der diese Seite ausliefert, kann die üblichen Zugriffsdaten — IP-Adresse, Zeitpunkt, angeforderte Datei — für kurze Zeit protokollieren, um den Betrieb und die Sicherheit zu gewährleisten.',
        'Deine Sprachauswahl liegt im localStorage deines eigenen Browsers. Wenn du die Websitedaten löschst, verschwindet sie.'
      ],
      priceTitle: 'Zum Preis',
      priceBody:
        'Vector Oso ist kostenlos und bleibt kostenlos. Der „trotzdem bezahlen“-Button ist ein Scherz, der tatsächlich funktioniert — er öffnet eine freiwillige Spendenseite. Hier wird nichts verkauft, es kommt kein Vertrag zustande, und durch eine Zahlung wird nichts freigeschaltet.',
      licenseTitle: 'Lizenz',
      licenseBody:
        'Vector Oso ist Open Source unter Apache-2.0. Du darfst es nutzen, untersuchen, verändern, weitergeben und unterlizenzieren, auch kommerziell, sofern du die Lizenz und anwendbare Hinweise beibehältst. Name und Logo sind von dieser Lizenz nicht erfasst.'
    }
  }
};

export function detectUserLocale(): Locale {
  if (typeof window === 'undefined') return 'en';

  const path = window.location.pathname.toLowerCase();
  if (path.startsWith('/de')) return 'de';
  if (path.startsWith('/en')) return 'en';

  try {
    const saved = localStorage.getItem('vector_oso_locale');
    if (saved === 'de' || saved === 'en') return saved;
  } catch {}

  const navLanguages = (typeof navigator !== 'undefined' && (navigator.languages || [navigator.language])) || [];
  for (const lang of navLanguages) {
    if (!lang) continue;
    const clean = lang.toLowerCase();
    if (clean.startsWith('de')) return 'de';
    if (clean.startsWith('en')) return 'en';
  }

  return 'en';
}

export function saveUserLocale(locale: Locale) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('vector_oso_locale', locale);
  } catch {}
  document.documentElement.lang = locale;
  document.title =
    locale === 'de'
      ? 'Vector Oso · Bilder lokal im Browser vektorisieren'
      : 'Vector Oso · Vectorize images locally in your browser';
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.setAttribute(
      'content',
      locale === 'de'
        ? 'Kostenloser Open-Source Vektorisierer: Wandle JPG und PNG lokal in gestochen scharfe SVG, PDF, EPS und DXF Pfade um. Keine Uploads, keine Paywall.'
        : 'Free open-source image vectorizer: Convert JPG and PNG into clean SVG, PDF, EPS, and DXF paths locally. No uploads, no paywall.'
    );
  }
}
