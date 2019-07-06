import EMAHelper from "../../../util/EMAHelper";

export default interface AudioWaveformSampler {
  // updates `currentXXX` for the latest point in time, perhaps lazily
  sample(): Float32Array;
  readonly currentSamples: Float32Array;
  readonly currentMaxAmplitude: number;
  readonly currentRMSAmplitude: number;
  readonly currentRmsEma3: EMAHelper;
  readonly currentRmsEma20: EMAHelper;
}

export type Implementation = new (audioSource: AudioNode, numSamples: number) => AudioWaveformSampler;

export class AnalyserNodeAudioWaveformSampler implements AudioWaveformSampler {
  public readonly currentSamples: Float32Array;
  private readonly analyser: AnalyserNode;
  private cacheIsDirty: boolean = true;
  private cachedMaxAmplitude: number = 0;
  private cachedRMSAmplitude: number = 0;
  private cachedRmsEma3 = new EMAHelper(0.015); // 0.0023 corresponds to about 20s, 2/(43*sec + 1)
  private cachedRmsEma20 = new EMAHelper(0.0023); // 0.0023 corresponds to about 20s, 2/(43*sec + 1)

  constructor(audioSource: AudioNode, numSamples: number) {
    this.currentSamples = new Float32Array(numSamples);

    const audioContext = audioSource.context;
    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = numSamples;

    audioSource.connect(this.analyser);
  }

  public sample() {
    this.analyser.getFloatTimeDomainData(this.currentSamples);
    this.cacheIsDirty = true;
    return this.currentSamples;
  }

  private updateCachedValuesIfNeeded() {
    if (this.cacheIsDirty) {
      const data = this.currentSamples;
      let maxAmplitude = 0;
      let sumSquares = 0;
      data.forEach(v => {
        const amplitude = Math.abs(v);
        if (amplitude > maxAmplitude) {
          maxAmplitude = amplitude;
        }
        sumSquares += v * v;
      });
      this.cachedMaxAmplitude = maxAmplitude;
      this.cachedRMSAmplitude = Math.sqrt(sumSquares / data.length);
      this.cachedRmsEma3.update(this.cachedRMSAmplitude);
      this.cachedRmsEma20.update(this.cachedRMSAmplitude);
      this.cacheIsDirty = false;
    }
  }

  public get currentMaxAmplitude() {
    this.updateCachedValuesIfNeeded();
    return this.cachedMaxAmplitude;
  }

  public get currentRMSAmplitude() {
    this.updateCachedValuesIfNeeded();
    return this.cachedRMSAmplitude;
  }

  public get currentRmsEma3() {
    this.updateCachedValuesIfNeeded();
    return this.cachedRmsEma3;
  }

  public get currentRmsEma20() {
    this.updateCachedValuesIfNeeded();
    return this.cachedRmsEma20;
  }
}

export function createAnalyserHelpers(
  audioSource: AudioNode
) {
  const audioContext = audioSource.context;
  const numSamples = 1024;

  const samplers: AudioWaveformSampler[] = [];

  const createAnalyserHelper = (type: "lowpass" | "highpass" | null = null) => {
    let filteredAudioSource: AudioNode;
    if (type) {
      const filter = new BiquadFilterNode(audioContext, { type });
      audioSource.connect(filter);
      filteredAudioSource = filter;
    } else {
      filteredAudioSource = audioSource;
    }

    const sampler = new AnalyserNodeAudioWaveformSampler(filteredAudioSource, numSamples);
    samplers.push(sampler);

    return sampler;
  };

  const direct = createAnalyserHelper();
  const low = createAnalyserHelper("lowpass");
  const high = createAnalyserHelper("highpass");

  return {
    direct,
    low,
    high,
    sampleAll: () => samplers.forEach(s => s.sample())
  };
}

