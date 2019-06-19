import { Vector2, Vector3 } from "three";

import * as Scene from "../../scenes/Scene";

import ColorRow from "../base/ColorRow";
import * as Colors from "../base/Colors";
import * as PianoVisualization from "../base/PianoVisualization";

const MAX_DISTANCE = 0.05;

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
  // document.body.appendChild(canvas);

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

class VoronoiHelper {
  private readonly pixelsForPoint: number[][];  // point index -> pixel indices (y*w+x, like imgData)
  private readonly maxCount: number;
  private readonly height: number;
  private readonly width: number;
  private readonly colors: ColorRow;
  private readonly valuesR: number[];
  private readonly valuesG: number[];
  private readonly valuesB: number[];

  constructor(attrs: {
    points: Vector2[],  // pixel coordinates
    width: number,  // pixels
    height: number,  // pixels
    maxDistance: number  // pixels
  }) {
    this.pixelsForPoint = attrs.points.map(_ => []);
    const counts = attrs.points.map(_ => 0);
    const p = new Vector2(0, 0);
    let i = 0;
    while (p.y < attrs.height) {
      p.x = 0;
      while (p.x < attrs.width) {
        const index = closestIndex(attrs.points, p, attrs.maxDistance);
        if (index !== null) {
          this.pixelsForPoint[index].push(i);
          ++counts[index];
        }
        ++i;
        ++p.x;
      }
      ++p.y;
    }
    this.maxCount = Math.max.apply(Math, counts);
    this.colors = new ColorRow(attrs.points.length);
    this.valuesR = new Array(attrs.points.length).fill(0);
    this.valuesG = new Array(attrs.points.length).fill(0);
    this.valuesB = new Array(attrs.points.length).fill(0);
    this.width = attrs.width;
    this.height = attrs.height;
  }

  public colorsFromCanvas(canvas: HTMLCanvasElement): ColorRow {
    if (canvas.height !== this.height || canvas.width !== this.width) {
      throw new Error("canvas isn't the right size");
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("can't get canvas context");
    }
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    this.valuesR.fill(0);
    this.valuesG.fill(0);
    this.valuesB.fill(0);
    this.pixelsForPoint.forEach((pixelIndexes, pointIndex) => {
      let rTotal = 0;
      let gTotal = 0;
      let bTotal = 0;
      pixelIndexes.forEach(pixelIndex => {
        rTotal += imgData.data[pixelIndex * 4];
        gTotal += imgData.data[pixelIndex * 4 + 1];
        bTotal += imgData.data[pixelIndex * 4 + 2];
      });
      const color = Colors.rgbUnchecked(
        Math.round(rTotal / this.maxCount),
        Math.round(gTotal / this.maxCount),
        Math.round(bTotal / this.maxCount)
      );
      this.colors.set(pointIndex, color);
    });

    return this.colors;
  }

  public drawColorsOnCanvas(canvas: HTMLCanvasElement, colors: ColorRow) {
    if (canvas.height !== this.height || canvas.width !== this.width) {
      throw new Error("canvas isn't the right size");
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("can't get canvas context");
    }

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const imgData = new ImageData(canvas.width, canvas.height);

    this.pixelsForPoint.forEach((pixelIndexes, pointIndex) => {
      const [r, g, b] = Colors.splitRGB(colors.get(pointIndex));
      pixelIndexes.forEach(pixelIndex => {
        imgData.data[pixelIndex * 4] = r;
        imgData.data[pixelIndex * 4 + 1] = g;
        imgData.data[pixelIndex * 4 + 2] = b;
        imgData.data[pixelIndex * 4 + 3] = 255; // alpha
      });
    });

    ctx.putImageData(imgData, 0, 0);
  }

  public drawDebugMapOnCanvas(canvas: HTMLCanvasElement) {
    const colors = new ColorRow(this.pixelsForPoint.length);
    for (let i = 0; i < this.pixelsForPoint.length; ++i) {
      colors.set(i, Colors.hsv(Math.random() * 360, 0.7, Math.random() * 0.5 + 0.5));
    }
    this.drawColorsOnCanvas(canvas, colors);
  }
}

export default class VoronoiMapperVisualization extends PianoVisualization.default {
  private colors: ColorRow | null = null;
  private helper: VoronoiHelper;
  private canvas: HTMLCanvasElement;

  constructor(scene: Scene.default) {
    super(scene);
    const allLeds = flatten(scene.leds);
    const leds2d = mapTo2D(allLeds.map(led => led.position));
    const extents = getExtents(leds2d);
    const width = MAX_DISTANCE * 2 + (extents.maxX - extents.minX);
    const height = MAX_DISTANCE * 2 + (extents.maxY - extents.minY);
    const maxDimension = 300;
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

    // leds mapped to pixel locations
    const points2d = leds2d.map(wp => {
      const x = (1 - (wp.x - extents.minX + MAX_DISTANCE) / width) * (canvasWidth - 1);
      const y = (1 - (wp.y - extents.minY + MAX_DISTANCE) / height) * (canvasHeight - 1);
      return new Vector2(x, y);
    });

    const maxDistancePixels = MAX_DISTANCE * (canvasWidth / width);

    const helper = new VoronoiHelper({
      points: points2d,
      width: canvasWidth,
      height: canvasHeight,
      maxDistance: maxDistancePixels
    });

    helper.drawDebugMapOnCanvas(canvas);

    const imgElement = document.createElement("img");
    imgElement.style.position = "absolute";
    imgElement.style.bottom = "0px";
    imgElement.onload = () => {
      ctx.drawImage(imgElement, 0, 0, imgElement.width, imgElement.height, 0, 0, canvasWidth, canvasHeight);
      // this.colors = helper.colorsFromCanvas(canvas);
      // helper.drawColorsOnCanvas(canvas, this.colors);
    };
    imgElement.src = "./owleyes.jpg";
    // document.body.appendChild(imgElement);

    this.helper = helper;
    this.canvas = canvas;
  }

  public render(elapsedMillis: number, state: PianoVisualization.State, context: PianoVisualization.Context): void {
    this.colors = this.helper.colorsFromCanvas(this.canvas);

    const colors = this.colors;
    if (colors === null) {
      return;
    }

    let index = 0;
    this.ledRows.forEach(leds => {
      for (let i = 0; i < leds.length; ++i) {
        leds.set(i, colors.get(index++));
      }
    });
  }
}
