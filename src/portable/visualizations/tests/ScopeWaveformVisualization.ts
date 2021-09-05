// import * as Colors from "../base/Colors";
import * as Visualization from "../../base/Visualization";
import AbstractVoronoiMapperVisualization from "../../visualizationUtils/AbstractVoronoiMapperVisualization";

const NUM_SAMPLES = 1024;

export default class MyVisualization extends AbstractVoronoiMapperVisualization {
  private readonly analyser: AnalyserNode | null;
  private readonly buffer: Float32Array;

  constructor(config: Visualization.Config) {
    super(config);

    if (config.audioSource !== null) {
      const context = config.audioSource.context;
      const analyser = new AnalyserNode(context);
      analyser.fftSize = NUM_SAMPLES;
      config.audioSource.connect(analyser);
      this.analyser = analyser;
      this.buffer = new Float32Array(this.analyser.fftSize);
    } else {
      this.analyser = null;
    }
  }

  protected renderToCanvas(context: Visualization.FrameContext) {
    const analyser = this.analyser;
    if (analyser === null) {
      return;
    }

    const canvas = this.canvas;
    const ctx = this.canvasContext;

    ctx.fillStyle = "black";
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";

    const dx = canvas.width / this.buffer.length;
    const cy = (canvas.height - 1) / 2;

    analyser.getFloatTimeDomainData(this.buffer);
    this.buffer.forEach((v, i) => {
      const h = cy * Math.abs(v) * 3;
      ctx.fillRect(dx * i, cy - h / 2, dx, h);
    });
  }
}
