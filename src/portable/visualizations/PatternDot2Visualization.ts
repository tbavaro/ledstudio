import * as Colors from "../base/Colors";
import * as Visualization from "../base/Visualization";

import AbstractVoronoiMapperVisualization from "./util/AbstractVoronoiMapperVisualization";

const MIN_RADIUS = 20;
const MAX_RADIUS = 40;
const DOTS_PER_SECOND = 4;

export default class PatternDot2Visualization extends AbstractVoronoiMapperVisualization {
  private numDotsRemainder = 0;

  protected renderToCanvas(context: Visualization.FrameContext) {
    const canvas = this.canvas;
    const ctx = this.canvasContext;

    ctx.fillStyle = "black";
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1 * context.elapsedMillis / 1000;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;

    let numDots = this.numDotsRemainder + DOTS_PER_SECOND * context.elapsedMillis / 1000;
    while (numDots >= 1) {
      const radius = Math.random() * (MAX_RADIUS - MIN_RADIUS) + MIN_RADIUS;
      const x = Math.random() * (canvas.width - radius * 2) + radius;
      const y = Math.random() * (canvas.height - radius * 2) + radius;
      const color = Colors.hsv(Math.random() * 360, 1, 1);

      // draw it
      ctx.fillStyle = Colors.cssColor(color);
      ctx.globalCompositeOperation = "lighter";
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      numDots -= 1;
    }

    this.numDotsRemainder = numDots;
  }
}