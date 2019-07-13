import * as Colors from "../base/Colors";
import * as Visualization from "../base/Visualization";

import AbstractVoronoiMapperVisualization from "./util/AbstractVoronoiMapperVisualization";

const NAME = "pattern:dot";
const RADIUS = 40;

class PatternDotVisualization extends AbstractVoronoiMapperVisualization {
  private phase = 0;

  protected renderToCanvas(context: Visualization.FrameContext) {
    const degreesPerSecond = 90 * context.beatController.hz();
    this.phase = (this.phase + degreesPerSecond * context.elapsedSeconds) % 360;
    const phaseRadians = this.phase / 180 * Math.PI;

    const canvas = this.canvas;
    const ctx = this.canvasContext;

    ctx.fillStyle = "black";
    ctx.globalAlpha = 3 * context.elapsedSeconds;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    ctx.fillStyle = Colors.cssColor(Colors.hsv(this.phase, 1, 1));
    ctx.globalAlpha = 1;

    const x = cx + Math.cos(phaseRadians) * cx;
    const y = cy;

    ctx.beginPath();
    ctx.arc(x, y, RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }
}

const factory = new Visualization.Factory(NAME, PatternDotVisualization);
export default factory;
