import type { Contour } from '../core/types';
import { fitBezierCurves } from '../core/bezier';
import { DEFAULT_SCALE, dim, pxToMm, type OutputScale } from '../core/outputScale';

const fmt = (n: number) => Number(n.toFixed(2));

export function generateSvgPathData(contours: Contour[], smoothFactor = 2): string {
  const pathParts: string[] = [];

  for (const contour of contours) {
    const nodes = fitBezierCurves(contour, smoothFactor);
    if (!nodes || nodes.length < 3) continue;

    let path = `M${fmt(nodes[0].point.x)} ${fmt(nodes[0].point.y)}`;

    for (let i = 0; i < nodes.length; i++) {
      const curr = nodes[i];
      const next = nodes[(i + 1) % nodes.length];

      const cp1X = fmt(curr.point.x + curr.tangent.x * curr.handle);
      const cp1Y = fmt(curr.point.y + curr.tangent.y * curr.handle);
      const cp2X = fmt(next.point.x - next.tangent.x * next.handle);
      const cp2Y = fmt(next.point.y - next.tangent.y * next.handle);
      const endX = fmt(next.point.x);
      const endY = fmt(next.point.y);

      path += `C${cp1X} ${cp1Y} ${cp2X} ${cp2Y} ${endX} ${endY}`;
    }

    pathParts.push(path + 'Z');
  }

  return pathParts.join(' ');
}

export function exportToSvg(
  contours: Contour[],
  width: number,
  height: number,
  smoothFactor = 2,
  scale: OutputScale = DEFAULT_SCALE
): Blob {
  const pathData = generateSvgPathData(contours, smoothFactor);
  const mm = pxToMm(scale);
  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${dim(width * mm)}mm" height="${dim(height * mm)}mm">
  <path d="${pathData}" fill="black" fill-rule="nonzero"/>
</svg>`;

  return new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
}
