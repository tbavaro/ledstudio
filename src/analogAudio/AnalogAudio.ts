import { removeFirst } from "../portable/Utils";

const FFT_SIZE = 2048;
const NUM_FREQUENCY_BINS = FFT_SIZE / 2;

export interface InputDeviceInfo {
  id: string;
  name: string;
}

export type EventType = "deviceListChanged";

export default class AnalogAudio {
  private inputDevicesInternal: InputDeviceInfo[] = [];
  private deviceListChangedListeners: Array<(this: this) => void> = [];
  private currentDeviceId: string | null = null;
  private analyser: AnalyserNode | null = null;
  private readonly frequencyDataBuffer: Uint8Array;

  constructor() {
    navigator.mediaDevices.enumerateDevices().then(this.setDevices);
    this.frequencyDataBuffer = new Uint8Array(NUM_FREQUENCY_BINS);
    this.createDebugView();
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

  public setCurrentDeviceId(deviceId: string | null) {
    if (deviceId !== this.currentDeviceId) {
      this.currentDeviceId = deviceId;
      this.analyser = null;
      if (deviceId !== null) {
        navigator.mediaDevices.getUserMedia({ audio: { deviceId: deviceId } }).then(stream => {
          // make sure this is still the stream I was trying to load
          if (deviceId === this.currentDeviceId) {
            const audioContext = new AudioContext();
            const audioSource = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = FFT_SIZE;
            analyser.smoothingTimeConstant = 0.8;
            audioSource.connect(analyser);
            this.analyser = analyser;
            if (analyser.frequencyBinCount !== NUM_FREQUENCY_BINS) {
              throw new Error("incorrect number of frequency bins");
            }
          }
        });
      }
    }
  }

  public getFrequencyData() {
    if (this.analyser !== null) {
      this.analyser.getByteFrequencyData(this.frequencyDataBuffer);
    } else {
      this.frequencyDataBuffer.fill(0);
    }
    return this.frequencyDataBuffer;
  }

  private setDevices = async (devices: MediaDeviceInfo[]) => {
    this.inputDevicesInternal = devices.filter(d => d.kind === "audioinput").map(d => ({
      id: d.deviceId,
      name: d.label || d.deviceId
    }));
    this.deviceListChangedListeners.forEach(listener => listener.call(this));
  }

  private createDebugView = () => {
    const targetHeight = 512;

    const binBatchSize = Math.floor(Math.max(1, NUM_FREQUENCY_BINS / targetHeight));
    const batchHeightPx = Math.max(1, targetHeight / (NUM_FREQUENCY_BINS / binBatchSize));
    const numBatches = NUM_FREQUENCY_BINS / binBatchSize;

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

    // const totalsGroups = 4;
    // const totals = new Array<number>(totalsGroups).fill(0);

    const renderFrame = () => {
      requestAnimationFrame(renderFrame);

      const frequencyData = this.getFrequencyData();

      values.fill(0);
      frequencyData.forEach((v, i) => {
        const idx = Math.floor(i / binBatchSize);
        // if (values[idx] < v) {
        //   values[idx] = v;
        // }
        values[idx] += (v / binBatchSize);
      });

      // shift everything left 1px
      const imageData = ctx.getImageData(1, 0, canvas.width - 1, canvas.height);
      ctx.putImageData(imageData, 0, 0);

      let total = 0;

      values.forEach((v, i) => {
        v = Math.pow(v / 255, 1) * 255;
        total += v;
        ctx.fillStyle = `rgb(${v}, 0, 0)`; // ${v}, ${v})`;
        ctx.fillRect(canvas.width - 1, i * batchHeightPx, 1, batchHeightPx);
      });

      total = total / values.length;
      ctx.fillStyle = `rgb(255, 255, 255)`;
      ctx.fillRect(canvas.width - 1, (total / 255 * canvas.height), 1, 5);
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
