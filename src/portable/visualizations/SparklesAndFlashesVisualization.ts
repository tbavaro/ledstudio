import { bracket01 } from "../../util/Utils";

import * as Colors from "../base/Colors";
import * as Visualization from "../base/Visualization";
import BasicAudioHelper from "./util/BasicAudioHelper";

const NAME = "sparklesAndFlashes";

const MIN_SPARKLES_PER_SECOND = 0;
const MAX_SPARKLES_PER_SECOND = 5000;
const PIXEL_HALF_LIFE_SECONDS = 0.1;

class SparklesAndFlashesVisualization extends Visualization.default {
  private readonly ledAddresses: Array<[number, number]>;
  private numLedsRemainder = 0;
  private readonly audioHelper: BasicAudioHelper | null;

  constructor(config: Visualization.Config) {
    super(config);

    if (config.audioSource !== null) {
      this.audioHelper = new BasicAudioHelper(config.audioSource);
    } else {
      this.audioHelper = null;
    }

    this.ledAddresses = [];
    config.scene.leds.forEach((row, rowNum) => row.forEach((_, i) => this.ledAddresses.push([rowNum, i])));
  }

  public render(context: Visualization.FrameContext): void {
    const { elapsedMillis } = context;

    let sparkleRateNormalized: number;
    let flashBrightness: number;
    if (this.audioHelper !== null) {
      const audioValues = this.audioHelper.getValues();
      sparkleRateNormalized = bracket01(Math.pow(audioValues.highRMS * 2, 3));
      flashBrightness = bracket01(Math.pow(audioValues.lowRMS * 2.5, 3) * 1.25 - 0.25);
    } else {
      sparkleRateNormalized = 0;
      flashBrightness = 0;
    }

    const sparkleRate = sparkleRateNormalized * (MAX_SPARKLES_PER_SECOND - MIN_SPARKLES_PER_SECOND) + MIN_SPARKLES_PER_SECOND;

    // fade all pixels
    const multiplier = Math.pow(0.5, elapsedMillis / 1000 / PIXEL_HALF_LIFE_SECONDS);
    this.ledRows.forEach(row => row.multiplyAll(multiplier));

    // flash
    const flashColor = Colors.hsv(0, 1, flashBrightness);
    this.ledRows.forEach(row => row.addAll(flashColor));

    let numLeds = this.numLedsRemainder + elapsedMillis / 1000 * sparkleRate;
    while (numLeds >= 1) {
      const n = Math.floor(Math.random() * this.ledAddresses.length);
      const [row, index] = this.ledAddresses[n];
      this.ledRows.get(row).set(index, Colors.WHITE);
      numLeds -= 1;
    }
    this.numLedsRemainder = numLeds;
  }
}

const factory = new Visualization.Factory(NAME, SparklesAndFlashesVisualization);
export default factory;
