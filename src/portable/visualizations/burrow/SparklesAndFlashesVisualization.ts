import { bracket01 } from "../../../util/Utils";
import * as Colors from "../../base/Colors";
import * as Visualization from "../../base/Visualization";
import { Signals } from "../../visualizationUtils/SignalsHelper";

const MIN_SPARKLES_PER_SECOND = 0;
const MAX_SPARKLES_PER_SECOND = 5000;
const DANCE_HALF_LIFE_SECONDS = 0.2;
const NOT_DANCE_HALF_LIFE_SECONDS = 1.0;

class LinearDecayingValue {
  public value: number;
  private readonly decayRate: number;

  constructor(
    initialValue: number,
    decayRate: number // units per second
  ) {
    this.value = initialValue;
    this.decayRate = decayRate;
  }

  public decay(elapsedSeconds: number): number {
    this.value = Math.max(0, this.value - elapsedSeconds * this.decayRate);
    return this.value;
  }

  // sets it to `value` if `value` is higher, otherwise no-op
  public bump(value: number): number {
    this.value = Math.max(value, this.value);
    return this.value;
  }
}

export default class SparklesAndFlashesVisualization extends Visualization.default {
  private numLedsRemainder = 0;

  private flashBrightness = new LinearDecayingValue(0, 1 / 0.125);

  private readonly lowTS: Visualization.TimeSeriesValue;
  private readonly highTS: Visualization.TimeSeriesValue;
  private readonly flashBrightnessTS: Visualization.TimeSeriesValue;
  private signals: Signals;

  constructor(config: Visualization.Config) {
    super(config);
    this.signals = config.signals;

    this.lowTS = config.createTimeSeries({ color: Colors.BLUE });
    this.highTS = config.createTimeSeries({ color: Colors.RED });
    this.flashBrightnessTS = config.createTimeSeries();
  }

  public render(context: Visualization.FrameContext): void {
    const { elapsedSeconds } = context;
    this.flashBrightness.decay(elapsedSeconds);

    const sparkleRateNormalized = 0; // bracket01(Math.pow(this.signals.audioValues.highRMSZScore20 / 4, 3));
    this.flashBrightness.bump(
      bracket01(
        Math.pow(this.signals.audioValues.lowRMSZScore20 / 2, 5) * 1.25 - 0.25
      )
    );
    // const sparkleRateNormalized = bracket01(Math.pow(this.signals.audioValues.highRMS * 2.5, 3));
    // this.flashBrightness.bump(bracket01(Math.pow(this.signals.audioValues.lowRMS * 3, 3) * 1.25 - 0.25));

    const sparkleRate =
      sparkleRateNormalized *
        (MAX_SPARKLES_PER_SECOND - MIN_SPARKLES_PER_SECOND) +
      MIN_SPARKLES_PER_SECOND;

    // fade all pixels
    const halfLife =
      this.signals.beatsSinceDrop < 16 || this.signals.soundsLikeDance
        ? DANCE_HALF_LIFE_SECONDS
        : NOT_DANCE_HALF_LIFE_SECONDS;
    const multiplier = Math.pow(0.5, elapsedSeconds / halfLife);
    this.ledColors.multiplyAll(multiplier);

    // flash
    const flashColor = Colors.multiply(Colors.BLUE, this.flashBrightness.value);
    this.ledColors.addAll(flashColor);

    let numLeds = this.numLedsRemainder + elapsedSeconds * sparkleRate;
    while (numLeds >= 1) {
      const n = Math.floor(Math.random() * this.ledColors.length);
      this.ledColors.set(n, Colors.WHITE);
      numLeds -= 1;
    }
    this.numLedsRemainder = numLeds;

    this.flashBrightnessTS.value = this.flashBrightness.value;
    this.lowTS.value = this.signals.audioValues.lowRMS;
    this.highTS.value = this.signals.audioValues.highRMS;
  }
}
