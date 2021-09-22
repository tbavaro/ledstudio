import { Vector2, Vector3 } from "three";

export function mapToXYOnly(points3d: Vector3[]): Vector2[] {
  return points3d.map(p => {
    return new Vector2(p.x, p.y);
  });
}

export function getExtents2(points: Vector2[]) {
  let firstX: number = NaN;
  let firstY: number = NaN;
  if (points.length > 0) {
    firstX = points[0].x;
    firstY = points[0].y;
  }

  let minX = firstX;
  let maxX = firstX;
  let minY = firstY;
  let maxY = firstY;

  for (const p of points) {
    if (p.x < minX) {
      minX = p.x;
    }
    if (p.x > maxX) {
      maxX = p.x;
    }
    if (p.y < minY) {
      minY = p.y;
    }
    if (p.y > maxY) {
      maxY = p.y;
    }
  }

  return {
    minX,
    maxX,
    minY,
    maxY
  };
}
