import { Vector2 } from "three";

// makes a triangle from a vertical piece and two arms.
// vertical piece starts at (0,0) and goes up (+y)
// top and bottom sides point to the right (+x)
// vertex order is [(0,0), (0,`verticalLength`), (<other vertex>)]
export function triangleFromLengths(attrs: {
  verticalLength: number,
  topSideLength: number,
  bottomSideLength: number,
  flipX?: boolean
}): [Vector2, Vector2, Vector2] {
  const v = attrs.verticalLength;
  const t = attrs.topSideLength;
  const b = attrs.bottomSideLength;

  const a = (b * b - t * t - v * v) / (2 * v);
  const w = Math.sqrt(t * t - a * a);

  return [
    new Vector2(0, 0),
    new Vector2(0, v),
    new Vector2((attrs.flipX ? -1 : 1) * w, v + a)
  ];
}

export function boundingBox2D(points: Vector2[]): [Vector2, Vector2] {
  if (points.length < 1) {
    throw new Error("no points");
  }

  const min = points[0].clone();
  const max = points[0].clone();

  points.forEach(p => {
    if (p.x < min.x) {
      min.x = p.x;
    }
    if (p.y < min.y) {
      min.y = p.y;
    }
    if (p.x > max.x) {
      max.x = p.x;
    }
    if (p.y > max.y) {
      max.y = p.y;
    }
  });

  return [min, max];
}

export function width2D(points: Vector2[]): number {
  const bounds = boundingBox2D(points);
  return bounds[1].x - bounds[0].x;
}
