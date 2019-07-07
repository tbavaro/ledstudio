import * as Colors from "../base/Colors";
import * as Visualization from "../base/Visualization";

import AbstractVoronoiMapperVisualization from "./util/AbstractVoronoiMapperVisualization";

import { bracket01 } from "../../util/Utils";

const NAME = "splotches";

const MIN_RADIUS = 20;
const MAX_RADIUS = 40;

class SplotchesVisualization extends AbstractVoronoiMapperVisualization {
  private lastFrameBeatsCount: number | undefined;

  protected renderToCanvas(context: Visualization.FrameContext) {
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
      const color = Colors.hsv(Math.random() * 360, 1, 1);

      // draw it
      ctx.fillStyle = Colors.cssColor(color);
      ctx.globalCompositeOperation = "lighter";
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();

      numDots -= 1;
    }
  }
}

const factory = new Visualization.Factory(NAME, SplotchesVisualization);
export default factory;
