import _ from "lodash";
import { getExtents2, mapToXYOnly } from "src/util/VectorUtils";

import Scene from "../../scenes/Scene";
import * as Colors from "../base/Colors";
import * as Visualization from "../base/Visualization";

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.style.backgroundColor = "black";
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

const initializeFor = _.memoize((scene: Scene) => {
  const allLeds = scene.ledMetadatas;
  const leds2d = mapToXYOnly(allLeds.map(led => led.position));
  const extents = getExtents2(leds2d);
  const physicalWidth = extents.maxX - extents.minX;
  const physicalHeight = extents.maxY - extents.minY;
  const maxDimension = scene.voronoiMaxDimension;
  let canvasWidth: number;
  let canvasHeight: number;
  if (physicalWidth > physicalHeight) {
    canvasWidth = maxDimension;
    canvasHeight = Math.ceil((maxDimension / physicalWidth) * physicalHeight);
  } else {
    canvasHeight = maxDimension;
    canvasWidth = Math.ceil((maxDimension / physicalHeight) * physicalWidth);
  }

  return {
    scene,
    canvasWidth,
    canvasHeight,
    ledDataOffsets: leds2d.map(wp => {
      const x = Math.round(
        (1 - (wp.x - extents.minX) / physicalWidth) * (canvasWidth - 1)
      );
      const y = Math.round(
        (1 - (wp.y - extents.minY) / physicalHeight) * (canvasHeight - 1)
      );
      return (y * canvasWidth + x) * 4;
    })
  };
});

export default abstract class MappedCanvasVisualization extends Visualization.default {
  protected readonly canvas: HTMLCanvasElement;
  protected readonly canvasContext: CanvasRenderingContext2D;

  // ordered in terms of LED indexes; values represent offsets into canvas
  // data array of R value (followed by G then B then unused A)
  private readonly ledDataOffsets: readonly number[];

  constructor(config: Visualization.Config) {
    super(config);

    const { canvasWidth, canvasHeight, ledDataOffsets } = initializeFor(
      config.scene
    );

    this.canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = this.canvas.getContext("2d");
    if (!ctx) {
      throw new Error("can't use canvas");
    }
    this.canvasContext = ctx;
    config.setExtraDisplay(this.canvas);

    this.ledDataOffsets = ledDataOffsets;
  }

  public render(context: Visualization.FrameContext): void {
    this.renderToCanvas(context);

    const data = this.canvasContext.getImageData(
      0,
      0,
      this.canvas.width,
      this.canvas.height
    ).data;

    this.ledDataOffsets.forEach((dataOffset, ledIndex) =>
      this.ledColors.set(
        ledIndex,
        Colors.rgbUnchecked(
          data[dataOffset],
          data[dataOffset + 1],
          data[dataOffset + 2]
        )
      )
    );
  }

  protected abstract renderToCanvas(context: Visualization.FrameContext): void;
}
