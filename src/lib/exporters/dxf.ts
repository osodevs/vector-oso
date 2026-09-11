import type { Contour } from '../core/types';
import { fitBezierCurves, sampleBezierContour } from '../core/bezier';
import { DEFAULT_SCALE, pxToMm, type OutputScale } from '../core/outputScale';

const fmt = (n: number) => Number(n.toFixed(4)).toString();

export function exportToDxf(
  contours: Contour[],
  width: number,
  height: number,
  smoothFactor = 2,
  samplesPerCurve = 6,
  scale: OutputScale = DEFAULT_SCALE
): Blob {
  const k = pxToMm(scale);
  const dxfLines: string[] = [
    '0', 'SECTION',
    '2', 'HEADER',
    '9', '$ACADVER',
    '1', 'AC1015',
    '9', '$INSUNITS',
    '70', '4',
    '9', '$EXTMIN',
    '10', '0',
    '20', '0',
    '9', '$EXTMAX',
    '10', fmt(width * k),
    '20', fmt(height * k),
    '0', 'ENDSEC',
    '0', 'SECTION',
    '2', 'TABLES',
    '0', 'TABLE',
    '2', 'LAYER',
    '70', '1',
    '0', 'LAYER',
    '2', 'VECTOR_OSO',
    '70', '0',
    '62', '7',
    '6', 'CONTINUOUS',
    '0', 'ENDTAB',
    '0', 'ENDSEC',
    '0', 'SECTION',
    '2', 'ENTITIES'
  ];

  for (const contour of contours) {
    const nodes = fitBezierCurves(contour, smoothFactor);
    if (!nodes || nodes.length < 3) continue;

    const sampledPoints = sampleBezierContour(nodes, samplesPerCurve);
    if (sampledPoints.length < 3) continue;

    dxfLines.push(
      '0', 'LWPOLYLINE',
      '100', 'AcDbEntity',
      '8', 'VECTOR_OSO',
      '100', 'AcDbPolyline',
      '90', String(sampledPoints.length),
      '70', '1'
    );

    for (const pt of sampledPoints) {
      dxfLines.push(
        '10', fmt(pt.x * k),
        '20', fmt((height - pt.y) * k)
      );
    }
  }

  dxfLines.push('0', 'ENDSEC', '0', 'EOF');

  return new Blob([dxfLines.join('\n')], { type: 'application/dxf;charset=utf-8' });
}
