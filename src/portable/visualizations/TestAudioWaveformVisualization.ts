import * as Visualization from "../base/Visualization";

const CANVAS_SCALE = 0.5;

class ByteDataCanvasHelper {
  public readonly canvas: HTMLCanvasElement;

  private readonly data: Uint8Array;
  private readonly canvasContext: CanvasRenderingContext2D;

  constructor(data: Uint8Array) {
    this.data = data;

    this.canvas = document.createElement("canvas");
    const ctx = this.canvas.getContext("2d");
    if (ctx === null) {
      throw new Error("can't get canvas context");
    }
    this.canvasContext = ctx;
    this.canvas.width = data.length * CANVAS_SCALE;
    this.canvas.height = 256 * CANVAS_SCALE;
    this.canvas.style.backgroundColor = "black";
    ctx.scale(CANVAS_SCALE, CANVAS_SCALE);
  }

  public render() {
    const canvas = this.canvas;
    const ctx = this.canvasContext;

    // clear
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width / CANVAS_SCALE, canvas.height / CANVAS_SCALE);

    // render values
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-1, 127);
    this.data.forEach((y, x) => {
      ctx.lineTo(x, y);
    });
    ctx.stroke();
  }
}

export default class TestAudioWaveformVisualization extends Visualization.default {
  private readonly analyser: AnalyserNode | null;
  private readonly dataBuffer: Uint8Array;
  private readonly canvasHelper: ByteDataCanvasHelper;

  constructor(config: Visualization.Config) {
    super(config);

    const audioSource = config.audioSource;
    if (audioSource !== null) {
      const audioContext = audioSource.context;
      this.analyser = audioContext.createAnalyser();
      this.analyser.fftSize = 1024;
      audioSource.connect(this.analyser);
      this.dataBuffer = new Uint8Array(this.analyser.fftSize);
    } else {
      this.analyser = null;
      this.dataBuffer = new Uint8Array(1);
    }

    this.canvasHelper = new ByteDataCanvasHelper(this.dataBuffer);
    config.setExtraDisplay(this.canvasHelper.canvas);
  }

  public render(context: Visualization.FrameContext): void {
    if (this.analyser === null) {
      return;
    }

    const data = this.dataBuffer;
    this.analyser.getByteTimeDomainData(data);

    // render
    this.canvasHelper.render();
  }
}
