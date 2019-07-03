import * as AudioWaveformSampler from "./AudioWaveformSampler";

const AudioWaveformSamplerImplementation = AudioWaveformSampler.AnalyserNodeAudioWaveformSampler;
const NUM_SAMPLES = 1024;

export interface Values {
  samples: Float32Array;
  unfilteredRMS: number;
  unfilteredPeak: number;
  lowRMS: number;
  lowPeak: number;
  highRMS: number;
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
      unfilteredPeak: 0,
      lowRMS: 0,
      lowPeak: 0,
      highRMS: 0,
      highPeak: 0
    };
  }

  public getValues(): Values {
    this.samplers.forEach(s => s.sample());

    const values = this.reusedValues;
    values.samples = this.unfilteredSampler.currentSamples;
    values.unfilteredRMS = this.unfilteredSampler.currentRMSAmplitude;
    values.unfilteredPeak = this.unfilteredSampler.currentMaxAmplitude;
    values.lowRMS = this.lowSampler.currentRMSAmplitude;
    values.lowPeak = this.lowSampler.currentMaxAmplitude;
    values.highRMS = this.highSampler.currentRMSAmplitude;
    values.highPeak = this.highSampler.currentMaxAmplitude;

    return values;
  }
}
