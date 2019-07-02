import * as Colors from "../base/Colors";
import * as Visualization from "../base/Visualization";
import * as AudioWaveformSampler from "./util/AudioWaveformSampler";

const NAME = "testAudioWaveform";

const CANVAS_SCALE = 0.5;

class FloatDataCanvasHelper {
  public readonly canvas: HTMLCanvasElement;

  private readonly data: Float32Array;
  private readonly canvasContext: CanvasRenderingContext2D;

  constructor(data: Float32Array) {
    this.data = data;

    this.canvas = document.createElement("canvas");
    const ctx = this.canvas.getContext("2d");
    if (ctx === null) {
      throw new Error("can't get canvas context");
    }
    this.canvasContext = ctx;
    this.canvas.width = data.length * CANVAS_SCALE;
    this.canvas.height = 255 * CANVAS_SCALE;
    this.canvas.style.backgroundColor = "black";
    ctx.scale(CANVAS_SCALE, CANVAS_SCALE);
  }

  public render(overrideData?: Float32Array) {
    const data = overrideData || this.data;
    if (data.length !== this.data.length) {
      throw new Error("overrideData has a different length");
    }

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
    data.forEach((y, x) => {
      ctx.lineTo(x, y * 127 + 127);
    });
    ctx.stroke();
  }
}

class TestAudioWaveformVisualization extends Visualization.default {
  private readonly analyserHelpers: ReturnType<typeof AudioWaveformSampler.createAnalyserHelpers> | null;
  private readonly canvasHelper: FloatDataCanvasHelper | null;

  private readonly lowTimeSeries: Visualization.TimeSeriesValueSetter;
  private readonly highTimeSeries: Visualization.TimeSeriesValueSetter;

  constructor(config: Visualization.Config) {
    super(config);

    const audioSource = config.audioSource;
    if (audioSource !== null) {
      this.analyserHelpers = AudioWaveformSampler.createAnalyserHelpers(audioSource);
      this.canvasHelper = new FloatDataCanvasHelper(this.analyserHelpers.direct.currentSamples);
      config.setExtraDisplay(this.canvasHelper.canvas);
    } else {
      this.analyserHelpers = null;
      this.canvasHelper = null;
    }

    this.lowTimeSeries = config.createTimeSeries({ color: Colors.BLUE });
    this.highTimeSeries = config.createTimeSeries({ color: Colors.RED });
  }

  public render(context: Visualization.FrameContext): void {
    if (this.analyserHelpers === null) {
      return;
    }

    this.analyserHelpers.sampleAll();

    // render
    if (this.canvasHelper !== null) {
      this.canvasHelper.render(this.analyserHelpers.direct.currentSamples);
    }

    this.lowTimeSeries.set(this.analyserHelpers.low.currentRMSAmplitude);
    this.highTimeSeries.set(this.analyserHelpers.high.currentRMSAmplitude);
  }
}

const factory = new Visualization.Factory(NAME, TestAudioWaveformVisualization);
export default factory;
