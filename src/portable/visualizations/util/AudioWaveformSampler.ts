export default interface AudioWaveformSampler {
  // updates `currentXXX` for the latest point in time, perhaps lazily
  sample(): Float32Array;
  readonly currentSamples: Float32Array;
  readonly currentMaxAmplitude: number;
  readonly currentRMSAmplitude: number;
}

export type Implementation = new (audioSource: AudioNode, numSamples: number) => AudioWaveformSampler;

export class AnalyserNodeAudioWaveformSampler implements AudioWaveformSampler {
  public readonly currentSamples: Float32Array;
  private readonly analyser: AnalyserNode;
  private cacheIsDirty: boolean = true;
  private cachedMaxAmplitude: number = 0;
  private cachedRMSAmplitude: number = 0;

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
}

export class ScriptProcessorNodeAudioWaveformSampler implements AudioWaveformSampler {
  public readonly currentSamples: Float32Array;
  private readonly scriptNode: ScriptProcessorNode;
  private cachedRMSAmplitude: number = 0;

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

    for (let i = 0; i < inputBuffer.numberOfChannels; ++i) {
      const data = inputBuffer.getChannelData(i);
      let myRms = 0;
      // tslint:disable-next-line:prefer-for-of
      for (let k = 0; k < data.length; ++k) {
        myRms += data[k] * data[k];
      }
      myRms = Math.sqrt(myRms / data.length);
      channelRms.push(myRms);
    }

    let total = 0;
    channelRms.forEach(x => total += x);
    this.cachedRMSAmplitude = total / channelRms.length;
  }

  public sample() {
    // TODO actually do something to grab the most recent samples, if we care
    return this.currentSamples;
  }

  public get currentMaxAmplitude(): number {
    throw new Error("not implemented");
  }

  public get currentRMSAmplitude() {
    return this.cachedRMSAmplitude;
  }
}
