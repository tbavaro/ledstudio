import * as Colors from "../base/Colors";
import * as Visualization from "../base/Visualization";

const SPEED = 3 / 1000;
const VERTICAL_SHARPNESS = 7;
const FLAPPINESS = 2;
const TIP_DISTANCE = 0.65; // 0 to 1
const TIP_FADE = 4;

const DEREZ = 0.4;

// derived
const PERIOD = Math.PI * 2 / SPEED;

// TODO improve flap motion
// TODO see if we can smooth it out by not perfectly following ribs

class PureWingFlapVisualization extends Visualization.default {
  private phase = 0;
  private readonly positionTimeSeries: Visualization.TimeSeriesValueSetter;

  constructor(config: Visualization.Config) {
    super(config);
    this.positionTimeSeries = config.createTimeSeries();
  }

  public render(context: Visualization.FrameContext): void {
    const { elapsedMillis } = context;

    this.phase = (this.phase + elapsedMillis * SPEED) % PERIOD;

    const positionNormalized = Math.pow(Math.sin(this.phase), FLAPPINESS);
    const position = positionNormalized * (this.ledRows.length - 1);

    this.ledRows.forEach((leds, row) => {
      const rowV = Math.pow(1 - (Math.abs(position - row) / (this.ledRows.length)), VERTICAL_SHARPNESS);
      const rowColor = Colors.hsv(0, 0, rowV);
      for (let i = 0; i < leds.length; ++i) {
        // -1 on left, 0 in middle, 1 on right
        const x = (i - (leds.length - 1) / 2) / ((leds.length - 1) / 2);

        // 1 at the tips, 0 where tips "start"
        const tippiness = Math.max(0, Math.abs(x) - TIP_DISTANCE) / (1 - TIP_DISTANCE);
        const color = Colors.multiply(rowColor, Math.pow(1 - tippiness, TIP_FADE));
        leds.set(i, color);
      }
    });

    this.positionTimeSeries.set(1 - positionNormalized);
  }
}

export default class PatternWingFlapVisualization extends Visualization.DerezVisualization {
  constructor(config: Visualization.Config) {
    super(new PureWingFlapVisualization(config), DEREZ);
  }
}