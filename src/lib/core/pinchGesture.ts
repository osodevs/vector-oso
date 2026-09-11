export interface PinchDelta {
  scale: number;
  dx: number;
  dy: number;
  midX: number;
  midY: number;
}

export interface PinchTracker {
  readonly count: number;
  readonly active: boolean;
  down(e: PointerEvent): void;
  move(e: PointerEvent): PinchDelta | null;
  up(e: PointerEvent): void;
  clear(): void;
}

export function createPinchTracker(): PinchTracker {
  const points = new Map<number, { x: number; y: number }>();
  let lastDist = 0;
  let lastMid = { x: 0, y: 0 };

  const pair = () => {
    const [a, b] = [...points.values()];
    return {
      dist: Math.hypot(b.x - a.x, b.y - a.y),
      mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
    };
  };

  return {
    get count() {
      return points.size;
    },
    get active() {
      return points.size >= 2;
    },
    down(e) {
      points.set(e.pointerId, { x: e.clientX, y: e.clientY });
      lastDist = 0;
    },
    move(e) {
      if (!points.has(e.pointerId)) return null;
      points.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (points.size !== 2) return null;

      const { dist, mid } = pair();
      if (lastDist === 0 || dist === 0) {
        lastDist = dist;
        lastMid = mid;
        return null;
      }

      const delta: PinchDelta = {
        scale: dist / lastDist,
        dx: mid.x - lastMid.x,
        dy: mid.y - lastMid.y,
        midX: mid.x,
        midY: mid.y
      };
      lastDist = dist;
      lastMid = mid;
      return delta;
    },
    up(e) {
      points.delete(e.pointerId);
      lastDist = 0;
    },
    clear() {
      points.clear();
      lastDist = 0;
    }
  };
}
