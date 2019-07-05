const EMA_ALPHA = 0.015; // corresponds to about last 2s .. ish

export default interface AudioWaveformSampler {
  // updates `currentXXX` for the latest point in time, perhaps lazily
  sample(): Float32Array;
  readonly currentSamples: Float32Array;
  readonly currentMaxAmplitude: number;
  readonly currentRMSAmplitude: number;
  readonly currentRMSExpMovingAvg: number;
  readonly currentRMSExpMovingVar: number;
  readonly currentRMSZScore: number;
}

export type Implementation = new (audioSource: AudioNode, numSamples: number) => AudioWaveformSampler;

export class AnalyserNodeAudioWaveformSampler implements AudioWaveformSampler {
  public readonly currentSamples: Float32Array;
  private readonly analyser: AnalyserNode;
  private cacheIsDirty: boolean = true;
  private cachedMaxAmplitude: number = 0;
  private cachedRMSAmplitude: number = 0;
  private cachedRMSExpMovingAvg: number = 0;
  private cachedRMSExpMovingVar: number = 0;

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

      const diff = this.cachedRMSAmplitude - this.cachedRMSExpMovingAvg;
      const incr = EMA_ALPHA * diff;
      this.cachedRMSExpMovingAvg = incr +  this.cachedRMSExpMovingAvg;
      this.cachedRMSExpMovingVar =  (1 - EMA_ALPHA) * ( this.cachedRMSExpMovingVar + diff * incr);

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

  public get currentRMSExpMovingAvg() {
    this.updateCachedValuesIfNeeded();
    return this.cachedRMSExpMovingAvg;
  }

  public get currentRMSExpMovingVar() {
    this.updateCachedValuesIfNeeded();
    return this.cachedRMSExpMovingVar;
  }

  public get currentRMSZScore() {
    this.updateCachedValuesIfNeeded();
    const stddev = Math.sqrt(this.cachedRMSExpMovingVar);
    return (this.cachedRMSAmplitude - this.cachedRMSExpMovingAvg) / stddev;
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
      if (type === "lowpass") {
        filteredAudioSource.connect(audioContext.destination);
      }
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

