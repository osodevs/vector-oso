import type { Contour } from '../core/types';
import { fitBezierCurves } from '../core/bezier';
import { DEFAULT_SCALE, dim, pxToPt, type OutputScale } from '../core/outputScale';

const fmt = (n: number) => Number(n.toFixed(2));

function buildPdfStream(contours: Contour[], height: number, smoothFactor: number, k: number): string {
  const commands: string[] = ['q', `${fmt(k)} 0 0 ${fmt(k)} 0 0 cm`, '0 0 0 rg'];
  const flipY = (y: number) => fmt(height - y);

  for (const contour of contours) {
    const nodes = fitBezierCurves(contour, smoothFactor);
    if (!nodes || nodes.length < 3) continue;

    commands.push(`${fmt(nodes[0].point.x)} ${flipY(nodes[0].point.y)} m`);

    for (let i = 0; i < nodes.length; i++) {
      const curr = nodes[i];
      const next = nodes[(i + 1) % nodes.length];

      const cp1X = fmt(curr.point.x + curr.tangent.x * curr.handle);
      const cp1Y = flipY(curr.point.y + curr.tangent.y * curr.handle);
      const cp2X = fmt(next.point.x - next.tangent.x * next.handle);
      const cp2Y = flipY(next.point.y - next.tangent.y * next.handle);
      const endX = fmt(next.point.x);
      const endY = flipY(next.point.y);

      commands.push(`${cp1X} ${cp1Y} ${cp2X} ${cp2Y} ${endX} ${endY} c`);
    }

    commands.push('h');
  }

  commands.push('f', 'Q');
  return commands.join('\n');
}

export function exportToPdf(
  contours: Contour[],
  width: number,
  height: number,
  smoothFactor = 2,
  scale: OutputScale = DEFAULT_SCALE
): Blob {
  const k = pxToPt(scale);
  const streamContent = buildPdfStream(contours, height, smoothFactor, k);
  const encoder = new TextEncoder();
  const streamLength = encoder.encode(streamContent).length;

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${dim(width * k)} ${dim(height * k)}] /Resources << >> /Contents 4 0 R >>`,
    `<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream`
  ];

  let pdfBody = '%PDF-1.4\n% Vector Oso export\n';
  const offsets = [0];

  objects.forEach((obj, idx) => {
    offsets.push(encoder.encode(pdfBody).length);
    pdfBody += `${idx + 1} 0 obj\n${obj}\nendobj\n`;
  });

  const startXref = encoder.encode(pdfBody).length;
  pdfBody += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

  for (const off of offsets.slice(1)) {
    pdfBody += `${String(off).padStart(10, '0')} 00000 n \n`;
  }

  pdfBody += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

  return new Blob([pdfBody], { type: 'application/pdf' });
}
