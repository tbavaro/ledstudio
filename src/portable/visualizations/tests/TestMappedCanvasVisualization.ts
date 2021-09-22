// import * as Colors from "../base/Colors";
import MappedCanvasVisualization from "src/portable/visualizationUtils/MappedCanvasVisualization";

import * as Visualization from "../../base/Visualization";

const SQUARES_SIZE = 8;
const VELOCITY_X = 1;
const VELOCITY_Y = -20;

export default class MyVisualization extends MappedCanvasVisualization {
  private offsetX = 0;
  private offsetY = 0;

  protected renderToCanvas(context: Visualization.FrameContext) {
    const { canvas, canvasContext: ctx } = this;

    ctx.fillStyle = "black";
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";

    let polarity = 0;
    for (
      let y = this.offsetY - SQUARES_SIZE * 2;
      y < canvas.height + SQUARES_SIZE;
      y += SQUARES_SIZE
    ) {
      polarity = 1 - polarity;
      for (
        let x = this.offsetX - (1 + polarity) * SQUARES_SIZE;
        x < canvas.width + SQUARES_SIZE;
        x += SQUARES_SIZE * 2
      ) {
        ctx.fillRect(x, y, SQUARES_SIZE, SQUARES_SIZE);
      }
    }

    this.offsetX =
      (this.offsetX + SQUARES_SIZE + VELOCITY_X * context.elapsedSeconds) %
      (SQUARES_SIZE * 2);
    this.offsetY =
      (this.offsetY + SQUARES_SIZE + VELOCITY_Y * context.elapsedSeconds) %
      (SQUARES_SIZE * 2);
  }
}
