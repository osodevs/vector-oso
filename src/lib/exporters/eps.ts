import type { Contour } from '../core/types';
import { fitBezierCurves } from '../core/bezier';
import { DEFAULT_SCALE, dim, pxToPt, type OutputScale } from '../core/outputScale';

const fmt = (n: number) => Number(n.toFixed(2));

export function exportToEps(
  contours: Contour[],
  width: number,
  height: number,
  smoothFactor = 2,
  scale: OutputScale = DEFAULT_SCALE
): Blob {
  const flipY = (y: number) => fmt(height - y);
  const k = pxToPt(scale);

  const lines: string[] = [
    '%!PS-Adobe-3.0 EPSF-3.0',
    `%%BoundingBox: 0 0 ${Math.ceil(width * k)} ${Math.ceil(height * k)}`,
    `%%HiResBoundingBox: 0 0 ${dim(width * k)} ${dim(height * k)}`,
    '%%Creator: Vector Oso',
    '%%Pages: 1',
    '%%LanguageLevel: 2',
    '%%EndComments',
    `${fmt(k)} ${fmt(k)} scale`,
    '0 setgray',
    'newpath'
  ];

  for (const contour of contours) {
    const nodes = fitBezierCurves(contour, smoothFactor);
    if (!nodes || nodes.length < 3) continue;

    lines.push(`${fmt(nodes[0].point.x)} ${flipY(nodes[0].point.y)} moveto`);

    for (let i = 0; i < nodes.length; i++) {
      const curr = nodes[i];
      const next = nodes[(i + 1) % nodes.length];

      const cp1X = fmt(curr.point.x + curr.tangent.x * curr.handle);
      const cp1Y = flipY(curr.point.y + curr.tangent.y * curr.handle);
      const cp2X = fmt(next.point.x - next.tangent.x * next.handle);
      const cp2Y = flipY(next.point.y - next.tangent.y * next.handle);
      const endX = fmt(next.point.x);
      const endY = flipY(next.point.y);

      lines.push(`${cp1X} ${cp1Y} ${cp2X} ${cp2Y} ${endX} ${endY} curveto`);
    }

    lines.push('closepath');
  }

  lines.push('fill', 'showpage', '%%EOF');

  return new Blob([lines.join('\n')], { type: 'application/postscript' });
}
