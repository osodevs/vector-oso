<script lang="ts">
  import type { Translations } from '../../i18n';
  import type { Point } from '../../core/types';
  import { fitBezierCurves } from '../../core/bezier';

  interface Props {
    t: Translations['landing'];
  }

  let { t }: Props = $props();

  function generateBearPolygon(): Point[] {
    const rawKeyframes: Point[] = [
      { x: 210, y: 70 }, { x: 195, y: 68 }, { x: 178, y: 72 }, { x: 162, y: 78 },
      { x: 150, y: 84 }, { x: 142, y: 74 }, { x: 135, y: 62 }, { x: 128, y: 48 }, { x: 120, y: 38 },
      { x: 110, y: 32 }, { x: 98, y: 34 }, { x: 88, y: 42 }, { x: 80, y: 56 }, { x: 76, y: 72 },
      { x: 78, y: 90 }, { x: 85, y: 106 }, { x: 96, y: 120 }, { x: 108, y: 130 },
      { x: 98, y: 144 }, { x: 88, y: 160 }, { x: 78, y: 178 }, { x: 70, y: 198 },
      { x: 64, y: 216 }, { x: 55, y: 228 }, { x: 68, y: 236 }, { x: 82, y: 242 },
      { x: 62, y: 254 }, { x: 76, y: 266 }, { x: 92, y: 274 },
      { x: 108, y: 286 }, { x: 124, y: 298 }, { x: 142, y: 308 }, { x: 162, y: 316 },
      { x: 180, y: 322 }, { x: 196, y: 326 }, { x: 210, y: 328 }, { x: 224, y: 326 }, { x: 240, y: 322 },
      { x: 258, y: 316 }, { x: 278, y: 308 }, { x: 296, y: 298 }, { x: 312, y: 286 },
      { x: 328, y: 274 }, { x: 344, y: 266 }, { x: 358, y: 254 },
      { x: 338, y: 242 }, { x: 352, y: 236 }, { x: 365, y: 228 }, { x: 356, y: 216 },
      { x: 350, y: 198 }, { x: 342, y: 178 }, { x: 332, y: 160 }, { x: 322, y: 144 },
      { x: 312, y: 130 }, { x: 324, y: 120 }, { x: 335, y: 106 }, { x: 342, y: 90 },
      { x: 344, y: 72 }, { x: 340, y: 56 }, { x: 332, y: 42 }, { x: 322, y: 34 }, { x: 310, y: 32 },
      { x: 300, y: 38 }, { x: 292, y: 48 }, { x: 285, y: 62 }, { x: 278, y: 74 }, { x: 270, y: 84 },
      { x: 258, y: 78 }, { x: 242, y: 72 }, { x: 225, y: 68 }
    ];

    const densePoints: Point[] = [];
    for (let i = 0; i < rawKeyframes.length; i++) {
      const p1 = rawKeyframes[i];
      const p2 = rawKeyframes[(i + 1) % rawKeyframes.length];
      densePoints.push(p1);
      const midX = (p1.x + p2.x) / 2 + ((i % 2 === 0 ? 1 : -1) * 0.8);
      const midY = (p1.y + p2.y) / 2 + ((i % 3 === 0 ? -1 : 1) * 0.8);
      densePoints.push({ x: Number(midX.toFixed(1)), y: Number(midY.toFixed(1)) });
    }
    return densePoints;
  }

  const basePolygon: Point[] = generateBearPolygon();

  let playgroundSmooth = $state(3.5);
  let playgroundSimplify = $state(2.5);
  let showPlaygroundNodes = $state(true);

  function simplifyPoints(points: Point[], tolerance: number): Point[] {
    if (points.length <= 4 || tolerance <= 0.05) return [...points];
    const sqTol = tolerance * tolerance * 12;

    function getSqDist(p: Point, p1: Point, p2: Point) {
      let x = p1.x, y = p1.y, dx = p2.x - x, dy = p2.y - y;
      if (dx !== 0 || dy !== 0) {
        const t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);
        if (t > 1) { x = p2.x; y = p2.y; }
        else if (t > 0) { x += dx * t; y += dy * t; }
      }
      dx = p.x - x; dy = p.y - y;
      return dx * dx + dy * dy;
    }

    function rdpStep(pts: Point[]): Point[] {
      let maxD = 0, index = 0;
      const end = pts.length - 1;
      for (let i = 1; i < end; i++) {
        const d = getSqDist(pts[i], pts[0], pts[end]);
        if (d > maxD) { index = i; maxD = d; }
      }
      if (maxD > sqTol) {
        const r1 = rdpStep(pts.slice(0, index + 1));
        const r2 = rdpStep(pts.slice(index));
        return r1.slice(0, -1).concat(r2);
      }
      return [pts[0], pts[end]];
    }

    return rdpStep(points);
  }

  let simplifiedPoly = $derived(
    simplifyPoints(basePolygon, playgroundSimplify)
  );

  let playgroundBezierNodes = $derived(
    fitBezierCurves(
      [...simplifiedPoly, simplifiedPoly[0]],
      playgroundSmooth
    )
  );

  let playgroundSvgPath = $derived.by(() => {
    const nodes = playgroundBezierNodes;
    if (!nodes || nodes.length < 3) return '';
    let d = `M${nodes[0].point.x.toFixed(1)} ${nodes[0].point.y.toFixed(1)}`;
    for (let i = 0; i < nodes.length; i++) {
      const curr = nodes[i];
      const next = nodes[(i + 1) % nodes.length];
      const cp1X = (curr.point.x + curr.tangent.x * curr.handle).toFixed(1);
      const cp1Y = (curr.point.y + curr.tangent.y * curr.handle).toFixed(1);
      const cp2X = (next.point.x - next.tangent.x * next.handle).toFixed(1);
      const cp2Y = (next.point.y - next.tangent.y * next.handle).toFixed(1);
      const endX = next.point.x.toFixed(1);
      const endY = next.point.y.toFixed(1);
      d += ` C${cp1X} ${cp1Y} ${cp2X} ${cp2Y} ${endX} ${endY}`;
    }
    return d + ' Z';
  });
</script>

<section class="seo-playground seo-boundary">
  <div class="seo-section-heading" data-reveal>
    <div class="heading-left">
      <span class="seo-kicker">{t.playKicker}</span>
      <h2>{t.playTitleP1}<br /><i>{t.playTitleP2}</i></h2>
    </div>
    <p>{t.playDesc}</p>
  </div>

  <div class="playground-stage" data-reveal>
    <div class="playground-canvas-box">
      <svg viewBox="0 0 420 360" class="playground-svg">
        <defs>
          <pattern id="playGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#playGrid)" />

        <path
          d={playgroundSvgPath}
          fill="rgba(37, 99, 235, 0.16)"
          stroke="#3b82f6"
          stroke-width="2.5"
          filter="drop-shadow(0 4px 20px rgba(37, 99, 235, 0.3))"
        />

        {#if showPlaygroundNodes && playgroundBezierNodes}
          <g class="playground-nodes-group">
            {#each playgroundBezierNodes as node}
              {#if node.handle > 2}
                <line
                  x1={node.point.x - node.tangent.x * node.handle}
                  y1={node.point.y - node.tangent.y * node.handle}
                  x2={node.point.x + node.tangent.x * node.handle}
                  y2={node.point.y + node.tangent.y * node.handle}
                  stroke="rgba(96, 165, 250, 0.6)"
                  stroke-width="1.5"
                />
                <circle
                  cx={node.point.x - node.tangent.x * node.handle}
                  cy={node.point.y - node.tangent.y * node.handle}
                  r="2.5"
                  fill="#60a5fa"
                />
                <circle
                  cx={node.point.x + node.tangent.x * node.handle}
                  cy={node.point.y + node.tangent.y * node.handle}
                  r="2.5"
                  fill="#60a5fa"
                />
              {/if}

              <circle
                cx={node.point.x}
                cy={node.point.y}
                r="4.5"
                fill="#ffffff"
                stroke="#2563eb"
                stroke-width="2"
              />
            {/each}
          </g>
        {/if}
      </svg>

      <div class="playground-badge-pill">
        <span class="badge-dot">●</span>
        <span>{t.playBadge}</span>
        <strong>{playgroundBezierNodes?.length || 0}</strong>
      </div>
    </div>

    <div class="playground-controls-box">
      <div class="control-row">
        <div class="control-header">
          <label for="play-simplify">{t.playSimplifyLabel}</label>
          <span class="control-value">{playgroundSimplify.toFixed(1)} mm</span>
        </div>
        <input
          id="play-simplify"
          type="range"
          min="0.1"
          max="8.0"
          step="0.1"
          bind:value={playgroundSimplify}
          aria-label={t.playSimplifyLabel}
        />
        <small>{t.playSimplifyDesc(basePolygon.length)}</small>
      </div>

      <div class="control-row">
        <div class="control-header">
          <label for="play-smooth">{t.playSmoothLabel}</label>
          <span class="control-value">{playgroundSmooth.toFixed(1)}</span>
        </div>
        <input
          id="play-smooth"
          type="range"
          min="0"
          max="10.0"
          step="0.5"
          bind:value={playgroundSmooth}
          aria-label={t.playSmoothLabel}
        />
        <small>{t.playSmoothDesc}</small>
      </div>

      <div class="control-toggle-row">
        <label class="toggle-label">
          <input type="checkbox" bind:checked={showPlaygroundNodes} />
          <span class="toggle-box"></span>
          <span class="toggle-text">{t.playShowNodes}</span>
        </label>
      </div>
    </div>
  </div>
</section>

<style>
  .seo-playground {
    min-height: 90svh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding-block: clamp(100px, 12vw, 180px);
    border-bottom: 1px solid var(--story-line, #242735);
  }

  .seo-section-heading {
    display: grid;
    grid-template-columns: minmax(0, 1.3fr) minmax(280px, 0.7fr);
    gap: 36px;
    align-items: end;
    margin-bottom: 48px;
  }

  .seo-kicker {
    display: inline-block;
    color: var(--story-accent, #60a5fa);
    font: 760 10.5px/1.3 var(--font-mono, ui-monospace, monospace);
    letter-spacing: 0.14em;
    text-transform: uppercase;
    margin-bottom: 12px;
  }

  .seo-section-heading h2 {
    font-size: clamp(48px, 5.5vw, 84px);
    font-weight: 650;
    line-height: 0.9;
    letter-spacing: -0.06em;
    color: var(--story-text, #f8fafc);
  }

  .seo-section-heading h2 i {
    color: var(--story-accent, #60a5fa);
    font-family: Georgia, 'Times New Roman', serif;
    font-style: italic;
    font-weight: 400;
  }

  .seo-section-heading > p {
    max-width: 480px;
    margin: 0 0 6px;
    font-size: 16px;
    line-height: 1.65;
    color: var(--story-muted, #94a3b8);
  }

  .playground-stage {
    display: grid;
    grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.75fr);
    gap: 32px;
    align-items: stretch;
  }

  .playground-canvas-box {
    position: relative;
    border: 1px solid var(--story-line, #242735);
    border-radius: 16px;
    background: #0d0f17;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 380px;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
  }

  .playground-svg {
    width: 100%;
    max-width: 420px;
    height: auto;
    display: block;
  }

  .playground-badge-pill {
    position: absolute;
    bottom: 16px;
    left: 16px;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 6px 12px;
    border-radius: 20px;
    background: rgba(13, 15, 23, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(12px);
    font-family: var(--font-mono, ui-monospace, monospace);
    font-size: 11px;
    color: #cbd5e1;
  }

  .badge-dot {
    color: #3b82f6;
    font-size: 8px;
  }

  .playground-badge-pill strong {
    color: #60a5fa;
    font-weight: 800;
  }

  .playground-controls-box {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 24px;
    padding: 32px;
    border: 1px solid var(--story-line, #242735);
    border-radius: 16px;
    background: #0d0f17;
  }

  .control-row {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .control-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 13px;
    font-weight: 700;
    color: #e2e8f0;
  }

  .control-value {
    font-family: var(--font-mono, ui-monospace, monospace);
    font-size: 12px;
    color: var(--story-accent, #60a5fa);
    font-weight: 700;
  }

  input[type="range"] {
    width: 100%;
    accent-color: #3b82f6;
    cursor: pointer;
  }

  .control-row small {
    font-size: 11.5px;
    color: #64748b;
    line-height: 1.45;
  }

  .control-toggle-row {
    padding-top: 12px;
    border-top: 1px solid #1e2330;
  }

  .toggle-label {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    color: #cbd5e1;
    user-select: none;
  }

  .toggle-label input {
    display: none;
  }

  .toggle-box {
    width: 18px;
    height: 18px;
    border-radius: 5px;
    border: 1px solid #333a4d;
    background: #141824;
    display: grid;
    place-items: center;
    transition: all 0.15s ease;
  }

  .toggle-label input:checked + .toggle-box {
    background: #2563eb;
    border-color: #3b82f6;
  }

  .toggle-label input:checked + .toggle-box::after {
    content: "✓";
    font-size: 11px;
    color: #ffffff;
    font-weight: 800;
  }

  @media (max-width: 900px) {
    .seo-playground {
      min-height: auto;
      padding-block: 72px;
    }

    .seo-section-heading {
      grid-template-columns: 1fr;
      gap: 20px;
      margin-bottom: 32px;
    }

    .seo-section-heading h2 {
      font-size: clamp(40px, 11vw, 64px);
    }

    .playground-stage {
      grid-template-columns: 1fr;
    }
  }
</style>
