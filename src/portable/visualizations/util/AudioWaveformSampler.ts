const EMA_ALPHA = 0.01;

export default interface AudioWaveformSampler {
  // updates `currentXXX` for the latest point in time, perhaps lazily
  sample(): Float32Array;
  readonly currentSamples: Float32Array;
  readonly currentMaxAmplitude: number;
  readonly currentRMSAmplitude: number;
  readonly currentRMSExpMovingAvg: number;
  readonly currentRMSExpMovingVar: number;
  readonly currentRMSExpMovingZScore: number;
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
      this.cachedRMSExpMovingVar =  (1 - EMA_ALPHA) * ( this.cachedRMSExpMovingAvg + diff * incr);

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

  public get currentRMSExpMovingZScore() {
    this.updateCachedValuesIfNeeded();
    const stddev = Math.sqrt(this.cachedRMSExpMovingVar);
    return (this.cachedRMSAmplitude - this.cachedRMSExpMovingAvg) / stddev;
  }
}

export class ScriptProcessorNodeAudioWaveformSampler implements AudioWaveformSampler {
  public readonly currentSamples: Float32Array;
  private readonly scriptNode: ScriptProcessorNode;
  private cachedRMSAmplitude: number = 0;
  private cachedMaxAmplitude: number = 0;
  private cachedRMSExpMovingAvg: number = 0;
  private cachedRMSExpMovingVar: number = 0;

  constructor(audioSource: AudioNode, numSamples: number) {
    this.currentSamples = new Float32Array(numSamples);

    const audioContext = audioSource.context;
    this.scriptNode = audioContext.createScriptProcessor(numSamples, audioSource.channelCount, audioSource.channelCount);
    this.scriptNode.onaudioprocess = this.onAudioProcess;

    audioSource.connect(this.scriptNode);
    this.scriptNode.connect(audioContext.destination);
  }

  private onAudioProcess = (event: AudioProcessingEvent) => {
    const channelRms: number[] = [];
    const inputBuffer = event.inputBuffer;

    let myMax = 0;
    for (let i = 0; i < inputBuffer.numberOfChannels; ++i) {
      const data = inputBuffer.getChannelData(i);
      let myRms = 0;
      // tslint:disable-next-line:prefer-for-of
      for (let k = 0; k < data.length; ++k) {
        myRms += data[k] * data[k];
        myMax = Math.max(myMax, Math.abs(data[k]));
      }
      myRms = Math.sqrt(myRms / data.length);
      channelRms.push(myRms);
    }

    let total = 0;
    channelRms.forEach(x => total += x);
    this.cachedRMSAmplitude = total / channelRms.length;
    this.cachedMaxAmplitude = myMax;

    const diff = this.cachedRMSAmplitude - this.cachedRMSExpMovingAvg;
    const incr = EMA_ALPHA * diff;
    this.cachedRMSExpMovingAvg = incr +  this.cachedRMSExpMovingAvg;
    this.cachedRMSExpMovingVar =  (1 - EMA_ALPHA) * ( this.cachedRMSExpMovingAvg + diff * incr);
  }

  public sample() {
    return this.currentSamples;
  }

  public get currentMaxAmplitude() {
    return this.cachedMaxAmplitude;
  }

  public get currentRMSAmplitude() {
    return this.cachedRMSAmplitude;
  }

  public get currentRMSExpMovingAvg() {
    return this.cachedRMSExpMovingAvg;
  }

  public get currentRMSExpMovingVar() {
    return this.cachedRMSExpMovingVar;
  }

  public get currentRMSExpMovingZScore() {
    const stddev = Math.sqrt(this.cachedRMSExpMovingVar);
    return (this.cachedRMSAmplitude - this.cachedRMSExpMovingAvg) / stddev;
  }
}

export function createAnalyserHelpers(
  samplerConstructor: Implementation,
  audioSource: AudioNode
) {
  const audioContext = audioSource.context;
  const numSamples = 1024;

  const samplers: AudioWaveformSampler[] = [];

  const createAnalyserHelper = (createFilter?: () => AudioNode) => {
    let filteredAudioSource: AudioNode;
    if (createFilter) {
      const filter = createFilter();
      audioSource.connect(filter);
      filteredAudioSource = filter;
    } else {
      filteredAudioSource = audioSource;
    }

    const sampler = new samplerConstructor(filteredAudioSource, numSamples);
    samplers.push(sampler);

    return sampler;
  };

  const direct = createAnalyserHelper();
  const low = createAnalyserHelper(() => new BiquadFilterNode(audioContext, { type: "lowpass" }));
  const high = createAnalyserHelper(() => new BiquadFilterNode(audioContext, { type: "highpass" }));

  return {
    direct,
    low,
    high,
    sampleAll: () => samplers.forEach(s => s.sample())
  };
}

