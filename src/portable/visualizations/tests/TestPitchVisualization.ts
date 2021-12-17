import { MovingAverageHelper } from "src/util/Utils";

import * as Colors from "../../base/Colors";
import * as Visualization from "../../base/Visualization";

const CANVAS_SCALE = 0.15;

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
    ctx.fillRect(
      0,
      0,
      canvas.width / CANVAS_SCALE,
      canvas.height / CANVAS_SCALE
    );

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

const NUM_SAMPLES = 2048;

export function findMaxValue(arr: Float32Array) {
  return arr.reduce((acc, v) => (v > acc ? v : acc), Number.MIN_VALUE);
}

function findMeanPositiveValue(arr: Float32Array) {
  let sum = 0;
  let n = 0;
  arr.forEach(v => {
    if (v > 0) {
      sum += v;
      n++;
    }
  });

  return n === 0 ? 0 : sum / n;
}

function meanDistanceBetweenPeaks(arr: Float32Array, threshold: number) {
  let hasCrossedZeroSincePeak = true;
  const peakIndices: number[] = [];

  let currentPeakWeightedSum = 0;
  let currentPeakTotalWeight = 0;

  arr.forEach((v, i) => {
    if (hasCrossedZeroSincePeak) {
      if (v >= threshold) {
        const weight = Math.pow(v, 4);
        currentPeakWeightedSum += i * weight;
        currentPeakTotalWeight += weight;
        hasCrossedZeroSincePeak = false;
      }
    } else {
      if (v < 0) {
        if (currentPeakTotalWeight > 0) {
          const peakIndex = currentPeakWeightedSum / currentPeakTotalWeight;
          peakIndices.push(peakIndex);
          currentPeakWeightedSum = 0;
          currentPeakTotalWeight = 0;
        }
        hasCrossedZeroSincePeak = true;
      }
    }
  });

  if (peakIndices.length < 2) {
    return undefined;
  } else {
    let sum = 0;
    const n = peakIndices.length - 1;
    for (let i = 0; i < n; ++i) {
      sum += peakIndices[i + 1] - peakIndices[i];
    }
    return sum / n;
  }
}

const noteHues = [
  0, // c
  210, // c#
  60, // d
  270, // d#
  120, // e
  330, // f
  180, // f#
  30, // g
  240, // g#
  90, // a
  300, // a#
  150 // b
];

const noteColors = noteHues.map(h => Colors.hsv(h, 1, 1));

export default class TestPitchVisualization extends Visualization.default {
  private readonly canvasHelper: FloatDataCanvasHelper;
  private readonly rawFreqTimeSeries: Visualization.TimeSeriesValue;
  private readonly freqTimeSeries: Visualization.TimeSeriesValue;
  private readonly amplitudeTimeSeries: Visualization.TimeSeriesValue;
  private readonly analyser?: AnalyserNode;
  private readonly currentSamples: Float32Array;
  private readonly sampleRate: number = 0;
  private readonly maHelper = new MovingAverageHelper(5);

  constructor(config: Visualization.Config) {
    super(config);

    const audioSource = config.audioSource;
    this.currentSamples = new Float32Array(NUM_SAMPLES);
    if (audioSource !== undefined) {
      this.analyser = audioSource.context.createAnalyser();
      // this.analyser.smoothingTimeConstant = 1;
      audioSource.connect(this.analyser);
      this.sampleRate = audioSource.context.sampleRate;
    }

    this.canvasHelper = new FloatDataCanvasHelper(this.currentSamples);
    config.setExtraDisplay(this.canvasHelper.canvas);

    this.freqTimeSeries = config.createTimeSeries({ color: Colors.BLUE });
    this.rawFreqTimeSeries = config.createTimeSeries({
      color: Colors.YELLOW
    });
    this.amplitudeTimeSeries = config.createTimeSeries({ color: Colors.RED });
  }

  public render(context: Visualization.FrameContext): void {
    let color = Colors.BLACK;

    // render
    if (this.analyser !== undefined) {
      this.analyser.getFloatTimeDomainData(this.currentSamples);
      // this.analyser.maxDecibels;

      // const maxValue = findMaxValue(this.currentSamples);
      const meanValue = findMeanPositiveValue(this.currentSamples);
      const thresholdValue = meanValue * 0.2;

      this.amplitudeTimeSeries.value = Math.sqrt(thresholdValue);
      if (thresholdValue < 0.001) {
        this.freqTimeSeries.value = 0;
        this.maHelper.reset();
      } else {
        const distanceBetweenPeaks =
          meanDistanceBetweenPeaks(this.currentSamples, thresholdValue) ?? 0;
        const sampledFreq =
          distanceBetweenPeaks === 0
            ? undefined
            : this.sampleRate / distanceBetweenPeaks;

        this.rawFreqTimeSeries.value = Math.min(1, (sampledFreq ?? 0) / 800);

        if (sampledFreq === undefined) {
          this.maHelper.reset();
        } else {
          this.maHelper.addValue(sampledFreq);
          const freq = this.maHelper.movingAverage;

          this.freqTimeSeries.value = Math.min(1, freq / 800);

          const note = Math.round(12 * Math.log2(freq / 440) + 69);

          // 0=c, 1=c#, ..., 11=b
          const noteWithinOctave = (note + 144) % 12;

          color = noteColors[noteWithinOctave];
        }
      }

      // this.analyserHelpers.direct.currentRMSAmplitude;
    }
    this.canvasHelper.render(this.currentSamples);

    // this.freqTimeSeries.value = this.analyserHelpers.direct.currentMaxAmplitude;

    this.ledColors.fill(color);
  }
}
