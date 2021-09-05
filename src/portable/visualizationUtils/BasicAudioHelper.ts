import * as AudioWaveformSampler from "./AudioWaveformSampler";

const AudioWaveformSamplerImplementation =
  AudioWaveformSampler.AnalyserNodeAudioWaveformSampler;
const NUM_SAMPLES = 1024;

export interface AudioValues {
  samples: Float32Array;
  unfilteredRMS: number;
  unfilteredRMSEMA3: number;
  unfilteredRMSZScore3: number;
  unfilteredRMSEMA20: number;
  unfilteredRMSZScore20: number;
  unfilteredPeak: number;
  lowRMS: number;
  lowRMSEMA3: number;
  lowRMSZScore3: number;
  lowRMSEMA20: number;
  lowRMSZScore20: number;
  lowPeak: number;
  highRMS: number;
  highRMSEMA3: number;
  highRMSZScore3: number;
  highRMSEMA20: number;
  highRMSZScore20: number;
  highPeak: number;
}

export default class BasicAudioHelper {
  private readonly samplers: AudioWaveformSampler.default[];
  private readonly unfilteredSampler: AudioWaveformSampler.default;
  private readonly lowSampler: AudioWaveformSampler.default;
  private readonly highSampler: AudioWaveformSampler.default;
  private readonly reusedValues: AudioValues;

  constructor(audioSource: AudioNode) {
    const audioContext = audioSource.context;

    this.samplers = [];
    const createAnalyserHelper = (createFilter?: () => AudioNode) => {
      let filteredAudioSource: AudioNode;
      if (createFilter) {
        const filter = createFilter();
        audioSource.connect(filter);
        filteredAudioSource = filter;
      } else {
        filteredAudioSource = audioSource;
      }

      const sampler = new AudioWaveformSamplerImplementation(
        filteredAudioSource,
        NUM_SAMPLES
      );
      this.samplers.push(sampler);

      return sampler;
    };

    this.unfilteredSampler = createAnalyserHelper();
    this.lowSampler = createAnalyserHelper(
      () => new BiquadFilterNode(audioContext, { type: "lowpass" })
    );
    this.highSampler = createAnalyserHelper(
      () => new BiquadFilterNode(audioContext, { type: "highpass" })
    );

    this.reusedValues = {
      samples: this.unfilteredSampler.currentSamples,
      unfilteredRMS: 0,
      unfilteredRMSEMA3: 0,
      unfilteredRMSZScore3: 0,
      unfilteredRMSEMA20: 0,
      unfilteredRMSZScore20: 0,
      unfilteredPeak: 0,
      lowRMS: 0,
      lowRMSEMA3: 0,
      lowRMSZScore3: 0,
      lowRMSEMA20: 0,
      lowRMSZScore20: 0,
      lowPeak: 0,
      highRMS: 0,
      highRMSEMA3: 0,
      highRMSZScore3: 0,
      highRMSEMA20: 0,
      highRMSZScore20: 0,
      highPeak: 0
    };
  }

  public getValues(): AudioValues {
    this.samplers.forEach(s => s.sample());

    const values = this.reusedValues;
    values.samples = this.unfilteredSampler.currentSamples;

    values.unfilteredRMS = this.unfilteredSampler.currentRMSAmplitude;
    values.unfilteredRMSZScore3 = this.unfilteredSampler.currentRmsEma3.zScore;
    values.unfilteredRMSEMA3 = this.unfilteredSampler.currentRmsEma3.ema;
    values.unfilteredRMSZScore20 =
      this.unfilteredSampler.currentRmsEma20.zScore;
    values.unfilteredRMSEMA20 = this.unfilteredSampler.currentRmsEma20.ema;
    values.unfilteredPeak = this.unfilteredSampler.currentMaxAmplitude;

    values.lowRMS = this.lowSampler.currentRMSAmplitude;
    values.lowRMSZScore3 = this.lowSampler.currentRmsEma3.zScore;
    values.lowRMSEMA3 = this.unfilteredSampler.currentRmsEma3.ema;
    values.lowRMSZScore20 = this.lowSampler.currentRmsEma20.zScore;
    values.lowRMSEMA20 = this.unfilteredSampler.currentRmsEma20.ema;
    values.lowPeak = this.lowSampler.currentMaxAmplitude;

    values.highRMS = this.highSampler.currentRMSAmplitude;
    values.highRMSEMA3 = this.highSampler.currentRmsEma3.ema;
    values.highRMSZScore3 = this.highSampler.currentRmsEma3.zScore;
    values.highRMSEMA20 = this.highSampler.currentRmsEma20.ema;
    values.highRMSZScore20 = this.highSampler.currentRmsEma20.zScore;
    values.highPeak = this.highSampler.currentMaxAmplitude;

    return values;
  }
}
