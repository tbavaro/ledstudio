import { Vector2, Vector3 } from "three";

export function map2dTo3d(attrs: {
  points: Vector2[],
  bottomLeft: Vector3,
  rightDirection: Vector3,
  upDirection: Vector3,
  scale?: number;
}): Vector3[] {
  const scale = (attrs.scale === undefined ? 1 : attrs.scale);
  const rightDelta = attrs.rightDirection.clone().normalize().multiplyScalar(scale);
  const upDelta = attrs.upDirection.clone().normalize().multiplyScalar(scale);

  // make sure up and right are right angles to one another otherwise things don't make sense
  const angle = rightDelta.angleTo(upDelta) * 180 / Math.PI;
  if (Math.abs(90 - Math.abs(angle)) > 0.1) {
    throw new Error("right and up don't make sense with relative angle of: " + angle);
  }

  return attrs.points.map(point => {
    const point3d = attrs.bottomLeft.clone();
    point3d.addScaledVector(rightDelta, point.x);
    point3d.addScaledVector(upDelta, point.y);
    return point3d;
  });
}

export interface Vector {
  clone: () => this;
  add: (other: this) => this;
  sub: (other: this) => this;
  length: () => number;
  normalize: () => this;
  multiplyScalar: (v: number) => this;
}

export function nPointsInDirection<V extends Vector>(attrs: {
  firstPoint: V,
  step: V,
  numPoints: number
}): V[] {
  const output: V[] = [];
  const nextPoint: V = attrs.firstPoint.clone();
  for (let i = 0; i < attrs.numPoints; ++i) {
    output.push(nextPoint.clone());
    nextPoint.add(attrs.step);
  }
  return output;
}

export function pointsFromTo<V extends Vector>(attrs: {
  start: V,
  end: V,
  spacing: number,
  skipFirst?: boolean
}): V[] {
  const delta = attrs.end.clone().sub(attrs.start);
  const distance = delta.length();
  const step = delta.normalize().multiplyScalar(attrs.spacing);

  const start = attrs.start.clone();
  let numPoints = 1 + Math.floor(distance / attrs.spacing);
  if (attrs.skipFirst) {
    start.add(step);
    numPoints -= 1;
  }

  return nPointsInDirection({
    firstPoint: start,
    step,
    numPoints
  });
}
