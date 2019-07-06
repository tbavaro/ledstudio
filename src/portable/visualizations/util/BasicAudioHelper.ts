import * as AudioWaveformSampler from "./AudioWaveformSampler";

const AudioWaveformSamplerImplementation = AudioWaveformSampler.AnalyserNodeAudioWaveformSampler;
const NUM_SAMPLES = 1024;

export interface Values {
  samples: Float32Array;
  unfilteredRMS: number;
  unfilteredRMSZScore3: number;
  unfilteredRMSZScore20: number;
  unfilteredPeak: number;
  lowRMS: number;
  lowRMSZScore3: number;
  lowRMSZScore20: number;
  lowPeak: number;
  highRMS: number;
  highRMSZScore3: number;
  highRMSZScore20: number;
  highPeak: number;
}

export default class BasicAudioHelper {
  private readonly samplers: AudioWaveformSampler.default[];
  private readonly unfilteredSampler: AudioWaveformSampler.default;
  private readonly lowSampler: AudioWaveformSampler.default;
  private readonly highSampler: AudioWaveformSampler.default;
  private readonly reusedValues: Values;

  constructor(audioSource: AudioNode | null) {
    let node: AudioNode;
    if (audioSource === null) {
      const ctx = new AudioContext();
      node = ctx.createGain();
    } else {
      node = audioSource;
    }

    const audioContext = node.context;

    this.samplers = [];
    const createAnalyserHelper = (createFilter?: () => AudioNode) => {
      let filteredAudioSource: AudioNode;
      if (createFilter) {
        const filter = createFilter();
        node.connect(filter);
        filteredAudioSource = filter;
      } else {
        filteredAudioSource = node;
      }

      const sampler = new AudioWaveformSamplerImplementation(filteredAudioSource, NUM_SAMPLES);
      this.samplers.push(sampler);

      return sampler;
    };

    this.unfilteredSampler = createAnalyserHelper();
    this.lowSampler = createAnalyserHelper(() => new BiquadFilterNode(audioContext, { type: "lowpass" }));
    this.highSampler = createAnalyserHelper(() => new BiquadFilterNode(audioContext, { type: "highpass" }));

    this.reusedValues = {
      samples: this.unfilteredSampler.currentSamples,
      unfilteredRMS: 0,
      unfilteredRMSZScore3: 0,
      unfilteredRMSZScore20: 0,
      unfilteredPeak: 0,
      lowRMS: 0,
      lowRMSZScore3: 0,
      lowRMSZScore20: 0,
      lowPeak: 0,
      highRMS: 0,
      highRMSZScore3: 0,
      highRMSZScore20: 0,
      highPeak: 0
    };
  }

  public getValues(): Values {
    this.samplers.forEach(s => s.sample());

    const values = this.reusedValues;
    values.samples = this.unfilteredSampler.currentSamples;
    values.unfilteredRMS = this.unfilteredSampler.currentRMSAmplitude;
    values.unfilteredRMSZScore3 = this.unfilteredSampler.currentRmsEma3.zScore;
    values.unfilteredRMSZScore20 = this.unfilteredSampler.currentRmsEma20.zScore;
    values.unfilteredPeak = this.unfilteredSampler.currentMaxAmplitude;
    values.lowRMS = this.lowSampler.currentRMSAmplitude;
    values.lowRMSZScore3 = this.lowSampler.currentRmsEma3.zScore;
    values.lowRMSZScore20 = this.lowSampler.currentRmsEma20.zScore;
    values.lowPeak = this.lowSampler.currentMaxAmplitude;
    values.highRMS = this.highSampler.currentRMSAmplitude;
    values.highRMSZScore3 = this.highSampler.currentRmsEma3.zScore;
    values.highRMSZScore20 = this.highSampler.currentRmsEma20.zScore;
    values.highPeak = this.highSampler.currentMaxAmplitude;

    return values;
  }
}
