import * as AudioWaveformSampler from "./AudioWaveformSampler";

const AudioWaveformSamplerImplementation = AudioWaveformSampler.AnalyserNodeAudioWaveformSampler;
const NUM_SAMPLES = 1024;

export interface Values {
  samples: Float32Array;
  unfilteredRMS: number;
  lowRMS: number;
  highRMS: number;
}

export default class BasicAudioHelper {
  private readonly samplers: AudioWaveformSampler.default[];
  private readonly unfilteredSampler: AudioWaveformSampler.default;
  private readonly lowSampler: AudioWaveformSampler.default;
  private readonly highSampler: AudioWaveformSampler.default;
  private readonly reusedValues: Values;

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
      lowRMS: 0,
      highRMS: 0
    };
  }

  public getValues(): Values {
    this.samplers.forEach(s => s.sample());

    const values = this.reusedValues;
    values.samples = this.unfilteredSampler.currentSamples;
    values.unfilteredRMS = this.unfilteredSampler.currentRMSAmplitude;
    values.lowRMS = this.lowSampler.currentRMSAmplitude;
    values.highRMS = this.highSampler.currentRMSAmplitude;

    return values;
  }
}
