import * as Visualization from "../base/Visualization";

import AbstractVoronoiMapperVisualization from "./util/AbstractVoronoiMapperVisualization";

const NAME = "pattern:clock";
const DEGREES_PER_SECOND = 180;

class PatternClockVisualization extends AbstractVoronoiMapperVisualization {
  private phase = 0;

  protected renderToCanvas(context: Visualization.FrameContext) {
    this.phase = (this.phase + DEGREES_PER_SECOND * context.elapsedSeconds) % 360;
    const phaseRadians = this.phase / 180 * Math.PI;

    const canvas = this.canvas;
    const ctx = this.canvasContext;

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const clockHandSize = Math.max(canvas.width, canvas.height) / 2;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    ctx.strokeStyle = "white";
    ctx.lineCap = "round";
    ctx.lineWidth = 50;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(phaseRadians) * clockHandSize, cy + Math.sin(phaseRadians) * clockHandSize);
    ctx.stroke();
  }
}

const factory = new Visualization.Factory(NAME, PatternClockVisualization);
export default factory;

class DerezPatternClockVisualization extends Visualization.DerezVisualization {
  constructor(config: Visualization.Config) {
    super(new PatternClockVisualization(config), 0.9);
  }
}

export const DerezPatternClockVisualizationFactory  = new Visualization.Factory("Derezed Clock", DerezPatternClockVisualization);
