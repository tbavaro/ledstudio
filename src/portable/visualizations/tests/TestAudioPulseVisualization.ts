import * as Colors from "../../base/Colors";
import * as Visualization from "../../base/Visualization";

import { bracket } from "../../../util/Utils";

const GROUP_NAME = "tests";
const NAME = "testAudioPulse";

const FFT_SIZE = 128;
const NUM_FREQUENCY_BINS = FFT_SIZE / 2;
const USE_LOWPASS_FILTER = false;

class BasicFFTHelper {
  private analyser: AnalyserNode;
  private readonly frequencyDataBuffer: Uint8Array;

  constructor(audioSource: AudioNode) {
    const audioContext = audioSource.context;
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = 0.8;

    if (USE_LOWPASS_FILTER) {
      // connect the source to low-pass filter, then low-pass filter to analyser
      const filter = new BiquadFilterNode(audioContext, { type: "lowpass" });
      audioSource.connect(filter);
      filter.connect(analyser);
    } else {
      // connect the source directly to analyser
      audioSource.connect(analyser);
    }

    this.analyser = analyser;
    if (analyser.frequencyBinCount !== NUM_FREQUENCY_BINS) {
      throw new Error("incorrect number of frequency bins");
    }

    this.frequencyDataBuffer = new Uint8Array(NUM_FREQUENCY_BINS);
  }

  public getFrequencyData() {
    if (this.analyser !== null) {
      this.analyser.getByteFrequencyData(this.frequencyDataBuffer);
    } else {
      this.frequencyDataBuffer.fill(0);
    }
    return this.frequencyDataBuffer;
  }
}

class TestAudioPulseVisualization extends Visualization.default {
  private readonly fft: BasicFFTHelper | null;
  private readonly pulseValueTimeSeries: Visualization.TimeSeriesValue;

  constructor(config: Visualization.Config) {
    super(config);
    this.fft = (config.audioSource === null ? null : new BasicFFTHelper(config.audioSource));
    this.pulseValueTimeSeries = config.createTimeSeries();
  }

  public render(context: Visualization.FrameContext): void {
    if (this.fft === null) {
      return;
    }

    const frequencyData = this.fft.getFrequencyData();

    let total = 0;
    frequencyData.forEach(v => total += v);

    // between 0 and 1
    const pulseValue = bracket(0, 1, total / frequencyData.length / 255);

    this.ledRows.forEach(row => {
      row.fill(Colors.BLACK);
      const midPoint = Math.floor(row.length / 2);
      const pulseWidth = pulseValue * row.length;
      const startIndex = Math.max(0, Math.floor(midPoint - pulseWidth / 2));
      const endIndex = Math.min(row.length - 1, Math.floor(midPoint + pulseWidth / 2));

      for (let i = startIndex; i <= endIndex; ++i) {
        row.set(i, Colors.WHITE);
      }
    });

    context.setFrameHeatmapValues(Array.from(frequencyData.values()).map(v => v / 255));
    this.pulseValueTimeSeries.value = pulseValue;
  }
}

const factory = new Visualization.Factory({ groupName: GROUP_NAME, name: NAME, ctor: TestAudioPulseVisualization });
export default factory;
