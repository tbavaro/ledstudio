import { bracket01 } from "../../util/Utils";

import * as Colors from "../base/Colors";
import * as Visualization from "../base/Visualization";
import BasicAudioHelper from "./util/BasicAudioHelper";

const NAME = "sparklesAndFlashes";

const MIN_SPARKLES_PER_SECOND = 0;
const MAX_SPARKLES_PER_SECOND = 5000;
const PIXEL_HALF_LIFE_SECONDS = 0.1;

class LinearDecayingValue {
  public value: number;
  private readonly decayRate: number;

  constructor(
    initialValue: number,
    decayRate: number  // units per second
  ) {
    this.value = initialValue;
    this.decayRate = decayRate;
  }

  public decay(elapsedMillis: number): number {
    this.value = Math.max(0, this.value - elapsedMillis / 1000 * this.decayRate);
    return this.value;
  }

  // sets it to `value` if `value` is higher, otherwise no-op
  public bump(value: number): number {
    this.value = Math.max(value, this.value);
    return this.value;
  }
}

class SparklesAndFlashesVisualization extends Visualization.default {
  private readonly ledAddresses: Array<[number, number]>;
  private numLedsRemainder = 0;
  private readonly audioHelper: BasicAudioHelper;

  private flashBrightness = new LinearDecayingValue(0, 1 / 0.125);

  private readonly lowTS: Visualization.TimeSeriesValueSetter;
  private readonly highTS: Visualization.TimeSeriesValueSetter;
  private readonly flashBrightnessTS: Visualization.TimeSeriesValueSetter;

  constructor(config: Visualization.Config) {
    super(config);
    this.audioHelper = new BasicAudioHelper(config.audioSource);

    this.ledAddresses = [];
    config.scene.leds.forEach((row, rowNum) => row.forEach((_, i) => this.ledAddresses.push([rowNum, i])));

    this.lowTS = config.createTimeSeries({ color: Colors.BLUE });
    this.highTS = config.createTimeSeries({ color: Colors.RED });
    this.flashBrightnessTS = config.createTimeSeries();
  }

  public render(context: Visualization.FrameContext): void {
    const { elapsedMillis } = context;

    this.flashBrightness.decay(elapsedMillis);

    const audioValues = this.audioHelper.getValues();
    const sparkleRateNormalized = bracket01(Math.pow(audioValues.highRMS * 2, 3));
    this.flashBrightness.bump(bracket01(Math.pow(audioValues.lowRMS * 2.5, 3) * 1.25 - 0.25));

    const sparkleRate = sparkleRateNormalized * (MAX_SPARKLES_PER_SECOND - MIN_SPARKLES_PER_SECOND) + MIN_SPARKLES_PER_SECOND;

    // fade all pixels
    const multiplier = Math.pow(0.5, elapsedMillis / 1000 / PIXEL_HALF_LIFE_SECONDS);
    this.ledRows.forEach(row => row.multiplyAll(multiplier));

    // flash
    const flashColor = Colors.hsv(0, 1, this.flashBrightness.value);
    this.ledRows.forEach(row => row.addAll(flashColor));

    let numLeds = this.numLedsRemainder + elapsedMillis / 1000 * sparkleRate;
    while (numLeds >= 1) {
      const n = Math.floor(Math.random() * this.ledAddresses.length);
      const [row, index] = this.ledAddresses[n];
      this.ledRows.get(row).set(index, Colors.WHITE);
      numLeds -= 1;
    }
    this.numLedsRemainder = numLeds;

    this.flashBrightnessTS.value = this.flashBrightness.value;
    this.lowTS.value = audioValues.lowRMS;
    this.highTS.value = audioValues.highRMS;
  }

}

const factory = new Visualization.Factory(NAME, SparklesAndFlashesVisualization);
export default factory;
