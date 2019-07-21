import * as Colors from "../../base/Colors";
import * as Visualization from "../../base/Visualization";

import AbstractVoronoiMapperVisualization from "../../visualizationUtils/AbstractVoronoiMapperVisualization";
import { Signals } from "../../visualizationUtils/SignalsHelper";
import { randomPalette } from "../../visualizationUtils/Utils";

import { bracket01 } from "../../../util/Utils";

const GROUP_NAME = "burrow";
const NAME = "splotches";

const MIN_RADIUS = 20;
const MAX_RADIUS = 40;

class SplotchesVisualization extends AbstractVoronoiMapperVisualization {
  private lastFrameBeatsCount: number | undefined;
  private palette: number[];
  private lastPaletteSwap: number;
  private signals: Signals;

  constructor(config: Visualization.Config) {
    super(config);
    this.swapPalettes();
    this.signals = config.signals;
  }

  protected renderToCanvas(context: Visualization.FrameContext) {

    if (Date.now() - this.lastPaletteSwap > 30000 && this.signals.soundsLikeStrongBeat) {
      this.swapPalettes();
    }


    const currentBeatsCount = Math.floor(context.beatController.beatNumber());
    const newWholeBeatsSinceLastFrame = Math.max(0, currentBeatsCount - (this.lastFrameBeatsCount || currentBeatsCount));
    this.lastFrameBeatsCount = currentBeatsCount;

    const canvas = this.canvas;
    const ctx = this.canvasContext;

    ctx.fillStyle = "black";
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = bracket01(1 * context.elapsedSeconds);
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;

    let numDots = newWholeBeatsSinceLastFrame;
    while (numDots >= 1) {
      const p = this.randomLedPixelPosition();
      const radius = Math.random() * (MAX_RADIUS - MIN_RADIUS) + MIN_RADIUS;
      const color = this.randomColor();

      // draw it
      ctx.fillStyle = Colors.cssColor(color);
      ctx.globalCompositeOperation = "lighter";
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();

      numDots -= 1;
    }
  }

  private randomColor() {
    return this.palette[Math.floor(Math.random() * (this.palette.length - 2)) + 2];
  }

  private swapPalettes() {
    this.palette = randomPalette(6);
    this.lastPaletteSwap = Date.now();
  }
}

const factory = new Visualization.Factory({ groupName: GROUP_NAME, name: NAME, ctor: SplotchesVisualization });
export default factory;

class DerezSplotchesVisualization extends Visualization.DerezVisualization {
  constructor(config: Visualization.Config) {
    super(new SplotchesVisualization(config), 0.75);
  }
}

export const DerezSplotchesVisualizationFactory  = new Visualization.Factory({ groupName: GROUP_NAME, name: "Derezed Splotches", ctor: DerezSplotchesVisualization });
