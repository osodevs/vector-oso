import type { BezierContour, Point } from '../core/types';

export const NODE_MIN_ZOOM = 55;
export const NODE_DRAW_BUDGET = 6000;
export const NODE_DETAIL_BUDGET = 1200;

export interface NodeRenderStats {
  belowZoom: boolean;

  inViewUpperBound: number;
  drawn: number;

  capped: boolean;
  detailed: boolean;
}

export interface ContourBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function computeBezierBounds(list: (BezierContour | null)[]): ContourBounds[] {
  return list.map((b) => {
    if (!b || b.length === 0) return { minX: 0, minY: 0, maxX: -1, maxY: -1 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let i = 0; i < b.length; i++) {
      const p = b[i].point;
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    return { minX, minY, maxX, maxY };
  });
}

export function calculateContourArea(nodes: BezierContour | null): number {
  if (!nodes || nodes.length < 3) return 0;
  let area = 0;
  const pts = nodes.map((n) => n.point);
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    area += pts[i].x * pts[j].y;
    area -= pts[j].x * pts[i].y;
  }
  return Math.round(Math.abs(area) / 2);
}

export function bezierToPathString(nodes: BezierContour | null): string {
  if (!nodes || nodes.length < 3) return '';
  let d = `M${nodes[0].point.x.toFixed(2)} ${nodes[0].point.y.toFixed(2)}`;
  for (let i = 0; i < nodes.length; i++) {
    const curr = nodes[i];
    const next = nodes[(i + 1) % nodes.length];
    const cp1X = (curr.point.x + curr.tangent.x * curr.handle).toFixed(2);
    const cp1Y = (curr.point.y + curr.tangent.y * curr.handle).toFixed(2);
    const cp2X = (next.point.x - next.tangent.x * next.handle).toFixed(2);
    const cp2Y = (next.point.y - next.tangent.y * next.handle).toFixed(2);
    const endX = next.point.x.toFixed(2);
    const endY = next.point.y.toFixed(2);
    d += ` C${cp1X} ${cp1Y} ${cp2X} ${cp2Y} ${endX} ${endY}`;
  }
  return d + ' Z';
}

export interface RenderNodeParams {
  ctx: CanvasRenderingContext2D;
  bezierContourList: (BezierContour | null)[];
  bounds?: ContourBounds[];
  targets: number[];
  zoomLevel: number;
  panX: number;
  panY: number;
  imageWidth: number;
  imageHeight: number;
  containerWidth: number;
  containerHeight: number;
}

export function renderScreenSpaceNodes({
  ctx,
  bezierContourList,
  bounds,
  targets,
  zoomLevel,
  panX,
  panY,
  imageWidth,
  imageHeight,
  containerWidth,
  containerHeight
}: RenderNodeParams): NodeRenderStats {
  const none: NodeRenderStats = {
    belowZoom: false,
    inViewUpperBound: 0,
    drawn: 0,
    capped: false,
    detailed: true
  };
  if (targets.length === 0 || imageWidth === 0 || imageHeight === 0) return none;
  if (zoomLevel < NODE_MIN_ZOOM) return { ...none, belowZoom: true };

  const scale = zoomLevel / 100;
  const originX = containerWidth / 2 + panX - (imageWidth / 2) * scale;
  const originY = containerHeight / 2 + panY - (imageHeight / 2) * scale;

  const AR = 3.2;
  const HR = 2.4;
  const PAD = 24;

  const viewMinX = (-PAD - originX) / scale;
  const viewMaxX = (containerWidth + PAD - originX) / scale;
  const viewMinY = (-PAD - originY) / scale;
  const viewMaxY = (containerHeight + PAD - originY) / scale;

  const offScreen = (i: number): boolean => {
    const bb = bounds?.[i];
    if (!bb) return false;
    return bb.maxX < viewMinX || bb.minX > viewMaxX || bb.maxY < viewMinY || bb.minY > viewMaxY;
  };

  let inView = 0;
  for (let t = 0; t < targets.length; t++) {
    const idx = targets[t];
    const b = bezierContourList[idx];
    if (!b || offScreen(idx)) continue;
    inView += b.length;
  }
  if (inView === 0) return none;

  const detailed = inView <= NODE_DETAIL_BUDGET;

  const anchors = new Path2D();
  const tangents = detailed ? new Path2D() : null;
  const handles = detailed ? new Path2D() : null;

  let drawn = 0;
  let capped = false;
  outer: for (let t = 0; t < targets.length; t++) {
    const idx = targets[t];
    const b = bezierContourList[idx];
    if (!b || offScreen(idx)) continue;

    for (let i = 0; i < b.length; i++) {
      const node = b[i];
      const px = node.point.x;
      const py = node.point.y;
      if (px < viewMinX || px > viewMaxX || py < viewMinY || py > viewMaxY) continue;
      if (drawn >= NODE_DRAW_BUDGET) {
        capped = true;
        break outer;
      }
      drawn++;

      const sx = originX + px * scale;
      const sy = originY + py * scale;
      anchors.rect(sx - AR, sy - AR, AR * 2, AR * 2);

      if (!detailed || node.handle <= 0.01) continue;

      const hx = node.tangent.x * node.handle * scale;
      const hy = node.tangent.y * node.handle * scale;

      tangents!.moveTo(sx + hx, sy + hy);
      tangents!.lineTo(sx - hx, sy - hy);

      handles!.moveTo(sx + hx + HR, sy + hy);
      handles!.arc(sx + hx, sy + hy, HR, 0, Math.PI * 2);
      handles!.moveTo(sx - hx + HR, sy - hy);
      handles!.arc(sx - hx, sy - hy, HR, 0, Math.PI * 2);
    }
  }

  ctx.lineWidth = 1;

  if (tangents) {
    ctx.strokeStyle = 'rgba(96, 165, 250, 0.55)';
    ctx.stroke(tangents);
  }

  if (handles) {
    ctx.fillStyle = '#60a5fa';
    ctx.strokeStyle = '#0f172a';
    ctx.fill(handles);
    ctx.stroke(handles);
  }

  ctx.fillStyle = '#2563eb';
  ctx.fill(anchors);
  if (detailed) {
    ctx.strokeStyle = '#ffffff';
    ctx.stroke(anchors);
  }

  return { belowZoom: false, inViewUpperBound: inView, drawn, capped, detailed };
}
