import * as Colors from "../base/Colors";
import FancyValue from "../base/FancyValue";
import * as Visualization from "../base/Visualization";

import { bracket01, fillArray } from "../../util/Utils";

const NAME = "fourierTwinkle";

const NUM_SAMPLES = 512;
const NUM_SAMPLES_RENDERED = NUM_SAMPLES / 2;

const DECAY_RATE = 4;

const MIN_THRESHOLD = 0.1;
const MAX_THRESHOLD = 0.7;

class MyVisualization extends Visualization.default {
  private readonly ledAddresses: Array<[number, number]>;
  private readonly analyser: AnalyserNode;
  private readonly buffer: Uint8Array;
  private bucketLocations: number[];
  private prevBeatNumber: number | undefined;
  private values: FancyValue[];

  constructor(config: Visualization.Config) {
    super(config);

    const audioSource = config.audioSource || (new AudioContext().createGain());
    const context = audioSource.context;
    const analyser = new AnalyserNode(context);
    analyser.fftSize = NUM_SAMPLES;
    analyser.smoothingTimeConstant = 0.2;
    audioSource.connect(analyser);
    this.analyser = analyser;
    this.buffer = new Uint8Array(this.analyser.frequencyBinCount);

    this.values = fillArray(NUM_SAMPLES_RENDERED, _ => new FancyValue(0));

    this.ledAddresses = [];
    config.scene.leds.forEach((row, rowNum) => row.forEach((_, i) => this.ledAddresses.push([rowNum, i])));
    this.shuffleLocations();
  }

  public shuffleLocations() {
    const numBuckets = NUM_SAMPLES_RENDERED;
    this.bucketLocations = [];
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < numBuckets; ++i) {
      let v: number;
      do {
        v = Math.floor(Math.random() * this.ledAddresses.length);
      } while (this.bucketLocations.includes(v));
      this.bucketLocations[i] = v;
    }
  }

  public render(context: Visualization.FrameContext): void {
    const analyser = this.analyser;
    if (analyser === null) {
      return;
    }

    const beatNumber = context.beatController.beatNumber();
    if (beatNumber !== this.prevBeatNumber) {
      this.shuffleLocations();
      this.prevBeatNumber = beatNumber;
    }

    analyser.getByteFrequencyData(this.buffer);
    for (let i = 0; i < NUM_SAMPLES_RENDERED; ++i) {
      const v = this.buffer[i] / 255;

      const value = Math.pow(bracket01((v - MIN_THRESHOLD) / (MAX_THRESHOLD - MIN_THRESHOLD)), 2);

      this.values[i].decayLinearRate(DECAY_RATE, context.elapsedSeconds);
      this.values[i].bumpTo(value);
    }

    // clear
    this.ledRows.forEach(r => r.multiplyAll(0.7));

    this.values.forEach((v, i) => {
      const freqPct = i / NUM_SAMPLES_RENDERED;

      const hue = 360 - i / NUM_SAMPLES_RENDERED * 240;
      const [rowNum, ledNum] = this.ledAddresses[this.bucketLocations[i]];

      const saturation = 1 - bracket01((v.value - 0.7) / 0.9);
      const value = bracket01(v.value / 0.7) * Math.pow(1 - freqPct, 0.25);

      const c = Colors.hsv(hue, saturation, value);

      const row = this.ledRows.get(rowNum);
      row.set(ledNum, c);
    });

    context.setFrameHeatmapValues(this.values.map(v => v.value));
  }
}

const factory = new Visualization.Factory(NAME, MyVisualization);
export default factory;
