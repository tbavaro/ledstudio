import * as Colors from "../base/Colors";
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

  public render(overrideData?: Uint8Array) {
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
      ctx.lineTo(x, y);
    });
    ctx.stroke();
  }
}

class AnalyserHelper {
  private readonly analyser: AnalyserNode;
  public readonly timeDataBuffer: Uint8Array;

  constructor(analyser: AnalyserNode) {
    this.analyser = analyser;
    this.timeDataBuffer = new Uint8Array(this.analyser.fftSize);
  }

  public getLevels() {
    const data = this.timeDataBuffer;
    this.analyser.getByteTimeDomainData(data);
    let maxAmplitude = 0;
    let sumSquares = 0;
    data.forEach(v => {
      const normalizedV = (v - 127) / 128;
      const amplitude = Math.abs(normalizedV);
      if (amplitude > maxAmplitude) {
        maxAmplitude = amplitude;
      }
      sumSquares += normalizedV * normalizedV;
    });
    const rmsAmplitude = Math.sqrt(sumSquares / data.length);

    return {
      timeData: data,
      max: maxAmplitude,
      rms: rmsAmplitude
    };
  }
}

function createAnalyserHelpers(audioSource: AudioNode) {
  const audioContext = audioSource.context;
  const fftSize = 1024;

  const createAnalyserHelper = (createFilter?: () => AudioNode) => {
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = fftSize;

    if (createFilter) {
      const filter = createFilter();
      audioSource.connect(filter);
      filter.connect(analyser);
    } else {
      audioSource.connect(analyser);
    }

    return new AnalyserHelper(analyser);
  };

  return {
    direct: createAnalyserHelper(),
    low: createAnalyserHelper(() => new BiquadFilterNode(audioContext, { type: "lowpass" })),
    high: createAnalyserHelper(() => new BiquadFilterNode(audioContext, { type: "highpass" }))
  };
}

export default class TestAudioWaveformVisualization extends Visualization.default {
  private readonly analyserHelpers: ReturnType<typeof createAnalyserHelpers> | null;
  private readonly canvasHelper: ByteDataCanvasHelper | null;

  constructor(config: Visualization.Config) {
    super(config);

    const audioSource = config.audioSource;
    if (audioSource !== null) {
      this.analyserHelpers = createAnalyserHelpers(audioSource);
      this.canvasHelper = new ByteDataCanvasHelper(this.analyserHelpers.direct.timeDataBuffer);
      config.setExtraDisplay(this.canvasHelper.canvas);
    } else {
      this.analyserHelpers = null;
      this.canvasHelper = null;
    }
  }

  public render(context: Visualization.FrameContext): void {
    if (this.analyserHelpers === null) {
      return;
    }

    const lowLevels = this.analyserHelpers.low.getLevels();
    const highLevels = this.analyserHelpers.high.getLevels();

    // render
    if (this.canvasHelper !== null) {
      const directLevels = this.analyserHelpers.direct.getLevels();
      this.canvasHelper.render(directLevels.timeData);
    }

    context.setFrameTimeseriesPoints([
      // {
      //   color: Colors.WHITE,
      //   value: directLevels.rms
      // },
      {
        color: Colors.BLUE,
        value: lowLevels.rms
      },
      {
        color: Colors.RED,
        value: highLevels.rms
      },
    ]);
  }
}
