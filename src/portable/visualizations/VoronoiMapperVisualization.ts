import { Vector2, Vector3 } from "three";

import * as Scene from "../../scenes/Scene";

import * as Colors from "../base/Colors";
import * as PianoVisualization from "../base/PianoVisualization";

const SPEED = 3 / 1000;
const VERTICAL_SHARPNESS = 7;
const FLAPPINESS = 2;
const TIP_DISTANCE = 0.65; // 0 to 1
const TIP_FADE = 4;
const MAX_DISTANCE = 0.1;

// derived
const PERIOD = Math.PI * 2 / SPEED;

// TODO this could be made to work with any co-planar points, but right now it requires all Z
// positions to be the same
function mapTo2D(points3d: Vector3[]): Vector2[] {
  if (points3d.length === 0) {
    return [];
  }

  const z = points3d[0].z;
  return points3d.map(p => {
    if (Math.abs(p.z - z) > 0.00001) {
      throw new Error("all Z values must be the same");
    }
    return new Vector2(p.x, p.y);
  });
}

function flatten<T>(arrays: T[][]): T[] {
  const output: T[] = [];
  arrays.forEach(arr => arr.forEach(v => output.push(v)));
  return output;
}

let existingCanvas: HTMLCanvasElement | null = null;
function createCanvas(width: number, height: number): HTMLCanvasElement {
  if (existingCanvas !== null) {
    const parent = existingCanvas.parentElement;
    if (parent !== null) {
      parent.removeChild(existingCanvas);
    }
    existingCanvas = null;
  }

  const canvas = document.createElement("canvas");
  canvas.style.position = "absolute";
  canvas.style.top = "5px";
  canvas.style.left = "5px";
  canvas.style.boxSizing = "border-box";
  canvas.style.border = "5px dashed green";
  canvas.style.backgroundColor = "black";
  canvas.width = width;
  canvas.height = height;
  document.body.appendChild(canvas);

  existingCanvas = canvas;
  return canvas;
}

function getExtents(points: Vector2[]) {
  if (points.length === 0) {
    throw new Error("need at least one point");
  }

  let minX = points[0].x;
  let maxX = points[0].x;
  let minY = points[0].y;
  let maxY = points[0].y;

  points.forEach(p => {
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
  });

  return {
    minX,
    maxX,
    minY,
    maxY
  };
}

function closestIndex(ps: Vector2[], p: Vector2, maxDistance?: number): number | null {
  if (ps.length === 0) {
    return null;
  }

  let bestIndex = 0;
  let bestDistance = p.distanceTo(ps[0]);
  ps.forEach((p2, i) => {
    const myDistance = p.distanceTo(p2);
    if (myDistance < bestDistance) {
      bestDistance = myDistance;
      bestIndex = i;
    }
  });

  if (maxDistance === undefined || bestDistance <= maxDistance) {
    return bestIndex;
  } else {
    return null;
  }
}

export default class VoronoiMapperVisualization extends PianoVisualization.default {
  private phase = 0;

  constructor(scene: Scene.default) {
    super(scene);
    const allLeds = flatten(scene.leds);
    const leds2d = mapTo2D(allLeds.map(led => led.position));
    const pointColors = leds2d.map(_ => Colors.hsv(Math.random() * 360, 0.7, Math.random() * 0.5 + 0.5));
    const extents = getExtents(leds2d);
    const width = MAX_DISTANCE * 2 + (extents.maxX - extents.minX);
    const height = MAX_DISTANCE * 2 + (extents.maxY - extents.minY);
    const maxDimension = 900;
    let canvasWidth: number;
    let canvasHeight: number;
    if (width > height) {
      canvasWidth = maxDimension;
      canvasHeight = Math.ceil(maxDimension / width * height);
    } else {
      canvasHeight = maxDimension;
      canvasWidth = Math.ceil(maxDimension / height * width);
    }
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("can't use canvas");
    }

    const worldPointToCanvasPoint = (wp: Vector2) => {
      const x = (wp.x - extents.minX + MAX_DISTANCE) / width * (canvasWidth - 1);
      const y = (1 - (wp.y - extents.minY + MAX_DISTANCE) / height) * (canvasHeight - 1);
      return new Vector2(x, y);
    };

    const canvasPointToWorldPoint = (cp: Vector2) => {
      const x = (cp.x / (canvasWidth - 1)) * width + extents.minX - MAX_DISTANCE;
      const y = (1 - cp.y / (canvasHeight - 1)) * height + extents.minY - MAX_DISTANCE;
      return new Vector2(x, y);
    };

    const drawPoint = (p: Vector2, color: Colors.Color) => {
      const cp = worldPointToCanvasPoint(p);
      ctx.fillStyle = Colors.cssColor(color);
      ctx.fillRect(cp.x, cp.y, 1, 1);
    };

    for (let x = 0; x < canvasWidth; ++x) {
      for (let y = 0; y < canvasHeight; ++y) {
        const cp = new Vector2(x, y);
        const wp = canvasPointToWorldPoint(cp);
        const index = closestIndex(leds2d, wp, MAX_DISTANCE);
        if (index !== null) {
          const color = pointColors[index];
          drawPoint(wp, color);
        }
      }
    }

    leds2d.forEach(p => drawPoint(p, Colors.BLACK));
  }

  public render(elapsedMillis: number, state: PianoVisualization.State, context: PianoVisualization.Context): void {
    this.phase = (this.phase + elapsedMillis * SPEED) % PERIOD;

    const positionNormalized = Math.pow(Math.sin(this.phase), FLAPPINESS);
    const position = positionNormalized * (this.ledRows.length - 1);

    this.ledRows.forEach((leds, row) => {
      const rowV = Math.pow(1 - (Math.abs(position - row) / (this.ledRows.length)), VERTICAL_SHARPNESS);
      const rowColor = Colors.hsv(0, 0, rowV);
      for (let i = 0; i < leds.length; ++i) {
        // -1 on left, 0 in middle, 1 on right
        const x = (i - (leds.length - 1) / 2) / ((leds.length - 1) / 2);

        // 1 at the tips, 0 where tips "start"
        const tippiness = Math.max(0, Math.abs(x) - TIP_DISTANCE) / (1 - TIP_DISTANCE);
        const color = Colors.multiply(rowColor, Math.pow(1 - tippiness, TIP_FADE));
        leds.set(i, color);
      }
    });

    context.setFrameTimeseriesPoints([{
      color: Colors.WHITE,
      value: 1 - positionNormalized
    }]);
  }
}
