import { removeFirst } from "../util/Utils";

export interface InputDeviceInfo {
  id: string;
  name: string;
}

export type EventType = "deviceListChanged";

export default class AudioIn {
  private inputDevicesInternal: InputDeviceInfo[] = [];
  private deviceListChangedListeners: Array<(this: this) => void> = [];
  private currentDeviceId: string | null = null;
  private currentAudioContext: AudioContext | null = null;
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

  public inputDeviceById(id: string | null): InputDeviceInfo | null {
    if (id === null) {
      return null;
    }

    const i = this.inputDevicesInternal.findIndex(v => v.id === id);
    return (i === -1 ? null : this.inputDevicesInternal[i]);
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
      this.setCurrentAudioSource(null, null);
      if (deviceId !== null) {
        const audioConstraints = {
          deviceId,
          autoGainControl: false,
          echoCancellation: false,
          noiseSuppression: false,
          sampleRate: 44100
        };
        navigator.mediaDevices.getUserMedia({ audio: audioConstraints }).then(stream => {
          // make sure this is still the stream I was trying to load
          if (deviceId === this.currentDeviceId) {
            const audioContext = new AudioContext();
            const audioSource = audioContext.createMediaStreamSource(stream);

            const splitter = audioContext.createChannelSplitter();
            audioSource.connect(splitter);

            const gain = audioContext.createGain();
            gain.channelCount = 1;
            gain.gain.value = 4;
            splitter.connect(gain, 0, 0);

            this.setCurrentAudioSource(audioContext, gain);
            // audioSource.connect(audioContext.destination);
          }
        });
      }
    }
  }

  private setCurrentAudioSource(newAudioContext: AudioContext | null, newAudioSource: AudioNode | null) {
    if (newAudioContext !== this.currentAudioContext) {
      if (this.currentAudioContext !== null) {
        this.currentAudioContext.close();
      }

      this.currentAudioContext = newAudioContext;
    }

    if (newAudioSource !== this.currentAudioSource) {
      if (this.currentAudioSource !== null) {
        this.currentAudioSource.disconnect();
      }

      this.currentAudioSource = newAudioSource;
      this.onAudioSourceChanged(newAudioSource);
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
