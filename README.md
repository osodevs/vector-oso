# Vector Oso

Webapp hosted on https://vector-oso.art

Turn a photo or scan of a drawing into a vector file, in the browser. Nothing is
uploaded — the image is decoded, traced and exported on your own machine.

Built for people who draw on paper and need the result on a pen plotter, a vinyl
cutter, or a stencil: SVG, PDF, EPS, DXF and PNG out, with the physical size
stated the same way in every one of them.

Pure engineering vibes.

## Quick start

```bash
npm install
npm run dev
```

Then open the printed URL and drop in an image.

```bash
npm run build      # production build into dist/
npm run preview    # serve that build locally
```

## How it works

The pipeline is deliberately short, and every step is visible in the interface.

1. **Colour to one number.** Rec. 709 luma, or a mix learned from the image when
   that separates ink from paper measurably better — useful for blue pencil or
   coloured stock.
2. **Even out the paper.** A least-squares quadratic surface is fitted to the
   lighting and subtracted, when the paper is uneven enough to matter.
3. **Cut.** One global threshold, seeded from the image and adjustable on the
   histogram itself. The chart is the control: drag the line to move the cut,
   scroll to zoom the tone range.
4. **Clean.** Ink specks and paper pinholes below a chosen size are removed
   together, since they are the same phenomenon at the same scale.
5. **Trace.** Marching squares with sub-pixel interpolation, then Laplacian
   smoothing and Ramer–Douglas–Peucker simplification. The simplify control is a
   distance in millimetres of finished output, not an abstract strength: set
   0.3 mm and no curve sits further than 0.3 mm from your drawing.
6. **Write.** Every exporter converts through a single declared DPI, so an SVG,
   a PDF and a DXF of the same trace measure the same.

Tracing runs in a Web Worker, so the interface stays responsive on large scans.

## Output targets

The presets set only the shape of the curve, never what counts as ink — a
machine cannot know what you meant to draw. Each is an argument about the tool:
a pen nib is 0.3–0.7 mm wide, so holding a curve tighter than the nib costs
plotting time and shows nothing.

## Stack

Svelte 5 (runes), TypeScript, Vite. No backend, no tracking, no accounts, no subscription, no billing.

## Licence

[Apache License 2.0](./LICENSE). You may use, modify, distribute, and sublicense
the code, including commercially, while retaining the licence and applicable notices.
