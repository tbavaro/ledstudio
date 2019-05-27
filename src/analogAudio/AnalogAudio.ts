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

  public get defaultDeviceId(): string | null {
    const defaultDevice = this.inputDevicesInternal.find(d => d.name.startsWith("Loopback"));
    if (defaultDevice === undefined) {
      return null;
    } else {
      return defaultDevice.id;
    }
  }

  private setDevices = async (devices: MediaDeviceInfo[]) => {
    this.inputDevicesInternal = devices.filter(d => d.kind === "audioinput").map(d => ({
      id: d.deviceId,
      name: d.label || d.deviceId
    }));
    this.deviceListChangedListeners.forEach(listener => listener.call(this));

    const defaultDeviceId = this.defaultDeviceId;
    if (defaultDeviceId === null) {
      throw new Error("no default device");
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: defaultDeviceId } });
    const audioContext = new AudioContext();
    const audioSource = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 32;
    audioSource.connect(analyser);

    const frequencyData = new Uint8Array(analyser.frequencyBinCount);

    const binBatchSize = 1;
    const batchHeightPx = 16;
    const numBatches = analyser.frequencyBinCount / binBatchSize;

    const canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.top = canvas.style.left = "50px";
    canvas.style.backgroundColor = "black";
    canvas.style.border = "5px dashed green";
    canvas.width = 500;
    canvas.height = numBatches * batchHeightPx;
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    if (ctx === null) {
      throw new Error("couldn't get canvas context");
    }

    const values = new Array<number>(numBatches).fill(0);

    const renderFrame = () => {
      requestAnimationFrame(renderFrame);

      analyser.getByteFrequencyData(frequencyData);
      values.fill(0);
      frequencyData.forEach((v, i) => {
        const idx = Math.floor(i / binBatchSize);
        if (values[idx] < v) {
          values[idx] = v;
        }
      });

      // shift everything left 1px
      const imageData = ctx.getImageData(1, 0, canvas.width - 1, canvas.height);
      ctx.putImageData(imageData, 0, 0);

      values.forEach((v, i) => {
        // v = Math.pow(v / 256, 2) * 256;
        ctx.fillStyle = `rgb(${v}, ${v}, ${v})`;
        ctx.fillRect(canvas.width - 1, i * batchHeightPx, 1, batchHeightPx);
      });
    };

    requestAnimationFrame(renderFrame);
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
