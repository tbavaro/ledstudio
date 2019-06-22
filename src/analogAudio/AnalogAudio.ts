import { removeFirst } from "../portable/Utils";

export interface InputDeviceInfo {
  id: string;
  name: string;
}

export type EventType = "deviceListChanged";

export default class AnalogAudio {
  private inputDevicesInternal: InputDeviceInfo[] = [];
  private deviceListChangedListeners: Array<(this: this) => void> = [];
  private currentDeviceId: string | null = null;
  private currentAudioSource: AudioNode | null = null;
  private readonly onAudioSourceChanged: (audioSource: AudioNode | null) => void;

  constructor(onAudioSourceChanged: (audioSource: AudioNode | null) => void) {
    this.onAudioSourceChanged = onAudioSourceChanged;

    if (navigator.mediaDevices !== undefined) {
      navigator.mediaDevices.enumerateDevices().then(this.setDevices);
    }
  }

  public get inputDevices() {
    return this.inputDevicesInternal;
  }

  public isValidId = (id: string | null) => {
    if (id === null) {
      return true;
    } else {
      return this.inputDevices.find(d => d.id === id) !== undefined;
    }
  }

  public get defaultDeviceId(): string | null {
    const defaultDevice = this.inputDevicesInternal.find(d => d.name === "Soundflower (2ch)");
    if (defaultDevice === undefined) {
      return null;
    } else {
      return defaultDevice.id;
    }
  }

  public setCurrentDeviceId(deviceId: string | null) {
    if (deviceId !== this.currentDeviceId) {
      this.currentDeviceId = deviceId;
      this.setCurrentAudioSource(null);
      if (deviceId !== null) {
        navigator.mediaDevices.getUserMedia({ audio: { deviceId: deviceId } }).then(stream => {
          // make sure this is still the stream I was trying to load
          if (deviceId === this.currentDeviceId) {
            const audioContext = new AudioContext();
            const audioSource = audioContext.createMediaStreamSource(stream);
            this.setCurrentAudioSource(audioSource);
          }
        });
      }
    }
  }

  private setCurrentAudioSource(newValue: AudioNode | null) {
    if (newValue !== this.currentAudioSource) {
      this.currentAudioSource = newValue;
      this.onAudioSourceChanged(newValue);
    }
  }

  private setDevices = async (devices: MediaDeviceInfo[]) => {
    this.inputDevicesInternal = devices.filter(d => d.kind === "audioinput").map(d => ({
      id: d.deviceId,
      name: d.label || d.deviceId
    }));
    this.deviceListChangedListeners.forEach(listener => listener.call(this));
  }

  public addEventListener(eventType: EventType, listener: (this: this) => void) {
    if (!this.deviceListChangedListeners.includes(listener)) {
      this.deviceListChangedListeners.push(listener);
    }
  }

  public removeEventListener(eventType: EventType, listener: (this: this) => void) {
    removeFirst(this.deviceListChangedListeners, listener);
  }
}

const FFT_SIZE = 128;
const NUM_FREQUENCY_BINS = FFT_SIZE / 2;

export class BasicFFT {
  private analyser: AnalyserNode;
  private readonly frequencyDataBuffer: Uint8Array;

  constructor(audioSource: AudioNode) {
    const audioContext = audioSource.context;
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = 0.8;
    audioSource.connect(analyser);

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