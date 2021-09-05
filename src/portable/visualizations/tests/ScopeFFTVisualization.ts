// import * as Colors from "../base/Colors";
import * as Visualization from "../../base/Visualization";
import AbstractVoronoiMapperVisualization from "../../visualizationUtils/AbstractVoronoiMapperVisualization";

const NUM_SAMPLES = 64;

export default class MyVisualization extends AbstractVoronoiMapperVisualization {
  private readonly analyser: AnalyserNode | null;
  private readonly buffer: Uint8Array;

  constructor(config: Visualization.Config) {
    super(config);

    if (config.audioSource !== null) {
      const context = config.audioSource.context;
      const analyser = new AnalyserNode(context);
      analyser.fftSize = NUM_SAMPLES;
      config.audioSource.connect(analyser);
      this.analyser = analyser;
      this.buffer = new Uint8Array(this.analyser.frequencyBinCount);
    } else {
      this.analyser = null;
      this.buffer = new Uint8Array(0);
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

    const dx = canvas.width / this.buffer.length / 2;
    const cy = (canvas.height - 1) / 2;

    analyser.getByteFrequencyData(this.buffer);
    this.buffer.forEach((v, i) => {
      const h = cy * (v / 255);
      ctx.fillRect(canvas.width * 0.5 + dx * i, cy - h / 2, dx + 1, h);
      ctx.fillRect(canvas.width * 0.5 - dx * i, cy - h / 2, dx + 1, h);
    });
  }
}
