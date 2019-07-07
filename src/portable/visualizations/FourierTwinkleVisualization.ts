import * as Colors from "../base/Colors";
import FancyValue from "../base/FancyValue";
import * as Visualization from "../base/Visualization";

import { bracket01, fillArray } from "../../util/Utils";

const NAME = "fourierTwinkle";

const NUM_SAMPLES = 1024;
const NUM_SAMPLES_RENDERED = NUM_SAMPLES / 4;

const MIN_THRESHOLD = 0.1;
const MAX_THRESHOLD = 0.8;

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

      // this.values[i].decayLinearRate(DECAY_RATE, context.elapsedMillis / 1000);
      this.values[i].value = value;
    }

    // clear
    this.ledRows.forEach(r => r.fill(Colors.BLACK));

    this.values.forEach((v, i) => {
      const hue = 360 - i / NUM_SAMPLES_RENDERED * 180;
      const [rowNum, ledNum] = this.ledAddresses[this.bucketLocations[i]];

      const c = Colors.hsv(hue, 1, v.value);

      const row = this.ledRows.get(rowNum);
      row.add(ledNum, c);
    });

    context.setFrameHeatmapValues(this.values.map(v => v.value));
  }
}

const factory = new Visualization.Factory(NAME, MyVisualization);
export default factory;
