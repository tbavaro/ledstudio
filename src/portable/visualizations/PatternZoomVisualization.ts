import * as Colors from "../base/Colors";
import * as Visualization from "../base/Visualization";

import AbstractVoronoiMapperVisualization from "./util/AbstractVoronoiMapperVisualization";

const ZOOM_SPEED = 2;
const RADIUS_STEP = 15;

export default class PatternZoomVisualization extends AbstractVoronoiMapperVisualization {
  private phase = 0;

  private drawCircle(radius: number, color: Colors.Color) {
    const canvas = this.canvas;
    const ctx = this.canvasContext;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    ctx.fillStyle = Colors.cssColor(color);
    ctx.globalAlpha = 1;

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  protected renderToCanvas(context: Visualization.FrameContext) {
    this.phase = (this.phase + ZOOM_SPEED * RADIUS_STEP * context.elapsedMillis / 1000) % (RADIUS_STEP * 2);

    const canvas = this.canvas;
    const ctx = this.canvasContext;

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let i = 0;
    for (let radius = this.phase + Math.max(canvas.width, canvas.height); radius > 0; radius -= RADIUS_STEP) {
      this.drawCircle(radius, (i % 2 === 0 ? Colors.hsv(radius * 2, 1, 1) : Colors.BLACK));
      ++i;
    }
  }
}
