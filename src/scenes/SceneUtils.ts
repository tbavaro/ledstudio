import { Vector2, Vector3 } from "three";
import * as Three from "three";

import { ExtraObjectFunc } from "./SceneDef";

// makes a triangle from a vertical piece and two arms.
// vertical piece starts at (0,0) and goes up (+y)
// top and bottom sides point to the right (+x)
// vertex order is [(0,0), (0,`verticalLength`), (<other vertex>)]
export function triangleFromLengths(attrs: {
  verticalLength: number;
  topSideLength: number;
  bottomSideLength: number;
  flipX?: boolean;
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

const EXTRA_OBJECT_MATERIAL_DEFAULT = () => {
  return new Three.MeshLambertMaterial({
    color: 0x111111
  });
};

// creates a box with the bottom centered at (0,0,0)
export function boxHelper(attrs: {
  width: number;
  height: number;
  depth: number;
  translateBy?: Vector3;
  material?: Three.Material;
}): ExtraObjectFunc {
  return () => {
    const geometry = new Three.BoxGeometry(
      attrs.width,
      attrs.height,
      attrs.depth
    );
    geometry.translate(0, attrs.height / 2, 0);
    if (attrs.translateBy) {
      geometry.translate(
        attrs.translateBy.x,
        attrs.translateBy.y,
        attrs.translateBy.z
      );
    }

    const material = attrs.material || EXTRA_OBJECT_MATERIAL_DEFAULT();
    const mesh = new Three.Mesh(geometry, material);
    return mesh;
  };
}
