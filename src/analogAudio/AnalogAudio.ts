import { removeFirst } from "../portable/Utils";

export interface InputDeviceInfo {
  id: string;
  name: string;
}

export type EventType = "deviceListChanged";

export default class AnalogAudio {
  private inputDevicesInternal: InputDeviceInfo[] = [];
  private deviceListChangedListeners: Array<(this: this) => void> = [];

  constructor() {
    navigator.mediaDevices.enumerateDevices().then(this.setDevices);
  }

  public get inputDevices() {
    return this.inputDevicesInternal;
  }

  private setDevices = (devices: MediaDeviceInfo[]) => {
    this.inputDevicesInternal = devices.filter(d => d.kind === "audioinput").map(d => ({
      id: d.deviceId,
      name: d.label || d.deviceId
    }));
    console.log("media devices", devices, this.inputDevicesInternal);
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
