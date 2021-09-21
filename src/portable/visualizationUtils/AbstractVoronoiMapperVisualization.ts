import { Vector2, Vector3 } from "three";

import Scene, { SceneLedMetadata } from "../../scenes/Scene";
import ColorRow from "../base/ColorRow";
import * as Colors from "../base/Colors";
import * as Visualization from "../base/Visualization";

const MAX_DISTANCE = 0.05;

// TODO this could be made to work with any co-planar points, but right now it requires all Z
// positions to be the same
function mapTo2DSingle(point3d: Vector3, vector?: Vector2): Vector2 {
  if (vector === undefined) {
    vector = new Vector2();
  }

  vector.set(point3d.x, point3d.y);

  return vector;
}

function mapTo2D(points3d: Vector3[]): Vector2[] {
  return points3d.map(p => {
    return new Vector2(p.x, p.y);
  });
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.style.backgroundColor = "black";
  canvas.width = width;
  canvas.height = height;
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

function closestIndex(
  ps: Vector2[],
  p: Vector2,
  maxDistance?: number
): number | null {
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
  private readonly pixelsForPoint: number[][]; // point index -> pixel indices (y*w+x, like imgData)
  // private readonly maxCount: number;
  private readonly height: number;
  private readonly width: number;
  private readonly colors: ColorRow;
  private readonly valuesR: number[];
  private readonly valuesG: number[];
  private readonly valuesB: number[];
  public readonly ledMapper: (
    ledMetadata: SceneLedMetadata,
    vector?: Vector2
  ) => Vector2;

  constructor(attrs: {
    points: Vector2[]; // pixel coordinates
    width: number; // pixels
    height: number; // pixels
    maxDistance: number; // pixels
    ledMapper: (ledMetadata: SceneLedMetadata, vector?: Vector2) => Vector2;
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

    let min = this.pixelsForPoint[0].length;
    let max = min;
    this.pixelsForPoint.forEach(vs => {
      const count = vs.length;
      if (count < min) {
        min = count;
      } else if (count > max) {
        max = count;
      }
    });

    console.log("voronoi stats", { min, max });

    // this.maxCount = Math.max.apply(Math, counts);
    this.colors = new ColorRow(attrs.points.length);
    this.valuesR = new Array(attrs.points.length).fill(0);
    this.valuesG = new Array(attrs.points.length).fill(0);
    this.valuesB = new Array(attrs.points.length).fill(0);
    this.width = attrs.width;
    this.height = attrs.height;
    this.ledMapper = attrs.ledMapper;
  }

  public colorsFromCanvas(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D
  ): ColorRow {
    if (canvas.height !== this.height || canvas.width !== this.width) {
      throw new Error("canvas isn't the right size");
    }

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    this.valuesR.fill(0);
    this.valuesG.fill(0);
    this.valuesB.fill(0);
    this.pixelsForPoint.forEach((pixelIndexes, pointIndex) => {
      let rTotal = 0;
      let gTotal = 0;
      let bTotal = 0;
      for (const pixelIndex of pixelIndexes) {
        rTotal += imgData.data[pixelIndex * 4];
        gTotal += imgData.data[pixelIndex * 4 + 1];
        bTotal += imgData.data[pixelIndex * 4 + 2];
      }
      const count = pixelIndexes.length;
      const color = Colors.rgbUnchecked(
        Math.round(rTotal / count),
        Math.round(gTotal / count),
        Math.round(bTotal / count)
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
      colors.set(
        i,
        Colors.hsv(Math.random() * 360, 0.7, Math.random() * 0.5 + 0.5)
      );
    }
    this.drawColorsOnCanvas(canvas, colors);
  }
}

interface InitializationValues {
  scene: Scene;
  helper: VoronoiHelper;
  canvasWidth: number;
  canvasHeight: number;
}

let cachedInitializationValues: InitializationValues | undefined;

function initializeFor(scene: Scene): InitializationValues {
  if (
    cachedInitializationValues &&
    cachedInitializationValues.scene === scene
  ) {
    return cachedInitializationValues;
  }

  const allLeds = scene.ledMetadatas;
  const leds2d = mapTo2D(allLeds.map(led => led.position));
  const extents = getExtents(leds2d);
  const width = MAX_DISTANCE * 2 + (extents.maxX - extents.minX);
  const height = MAX_DISTANCE * 2 + (extents.maxY - extents.minY);
  const maxDimension = scene.voronoiMaxDimension;
  let canvasWidth: number;
  let canvasHeight: number;
  if (width > height) {
    canvasWidth = maxDimension;
    canvasHeight = Math.ceil((maxDimension / width) * height);
  } else {
    canvasHeight = maxDimension;
    canvasWidth = Math.ceil((maxDimension / height) * width);
  }

  const mapToCanvas = (wp: Vector2, vector?: Vector2) => {
    if (vector === undefined) {
      vector = new Vector2();
    }
    const x =
      (1 - (wp.x - extents.minX + MAX_DISTANCE) / width) * (canvasWidth - 1);
    const y =
      (1 - (wp.y - extents.minY + MAX_DISTANCE) / height) * (canvasHeight - 1);
    vector.set(x, y);
    return vector;
  };

  // leds mapped to pixel locations
  const points2d = leds2d.map(wp => mapToCanvas(wp));

  const maxDistancePixels = MAX_DISTANCE * (canvasWidth / width);

  const ledMapperScratchVector = new Vector2();

  const helper = new VoronoiHelper({
    points: points2d,
    width: canvasWidth,
    height: canvasHeight,
    maxDistance: maxDistancePixels,
    ledMapper: (ledMetadata: SceneLedMetadata, vector?: Vector2) => {
      return mapToCanvas(
        mapTo2DSingle(ledMetadata.position, ledMapperScratchVector),
        vector
      );
    }
  });

  // helper.drawDebugMapOnCanvas(canvas);

  cachedInitializationValues = {
    scene,
    helper,
    canvasWidth,
    canvasHeight
  };

  return cachedInitializationValues;
}

export default abstract class AbstractVoronoiMapperVisualization extends Visualization.default {
  private helper: VoronoiHelper;
  protected canvas: HTMLCanvasElement;
  protected canvasContext: CanvasRenderingContext2D;
  private allLedMetadatas: SceneLedMetadata[];

  constructor(config: Visualization.Config) {
    super(config);
    const values = initializeFor(config.scene);
    this.helper = values.helper;

    this.canvas = createCanvas(values.canvasWidth, values.canvasHeight);
    const ctx = this.canvas.getContext("2d");
    if (!ctx) {
      throw new Error("can't use canvas");
    }
    this.canvasContext = ctx;
    config.setExtraDisplay(this.canvas);
    this.allLedMetadatas = config.scene.ledMetadatas;
  }

  public render(context: Visualization.FrameContext): void {
    this.renderToCanvas(context);
    const colors = this.helper.colorsFromCanvas(
      this.canvas,
      this.canvasContext
    );
    colors.forEach((color, i) => this.ledColors.set(i, color));
  }

  protected abstract renderToCanvas(context: Visualization.FrameContext): void;

  protected mapTo2d(ledMetadata: SceneLedMetadata, vector?: Vector2): Vector2 {
    return this.helper.ledMapper(ledMetadata, vector);
  }

  protected randomLedPixelPosition(vector?: Vector2): Vector2 {
    const ledMetadata =
      this.allLedMetadatas[
        Math.floor(Math.random() * this.allLedMetadatas.length)
      ];
    return this.mapTo2d(ledMetadata, vector);
  }
}
