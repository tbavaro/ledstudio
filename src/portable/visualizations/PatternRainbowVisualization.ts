import * as Colors from "../base/Colors";
import * as Visualization from "../base/Visualization";

const GROUP_NAME = "patterns";
const NAME = "pattern:rainbow";

const DEFAULT_SPEED = 0.3;
const MAX_SPEED = 1;

class PatternRainbowVisualization extends Visualization.SingleRowVisualization {
  private offset = 0;
  private width = 88; // pixels per 360 degrees

  private readonly ludicrousSpeedButton: Visualization.ButtonControl;
  private readonly speedDial: Visualization.DialControl;

  constructor(config: Visualization.Config) {
    super(config, Math.max.apply(Math, config.scene.leds.map(arr => arr.length)));

    this.speedDial = config.createDialControl({
      initialValue: DEFAULT_SPEED,
      minValue: -1 * MAX_SPEED,
      maxValue: MAX_SPEED
    });
    this.ludicrousSpeedButton = config.createButtonControl();
  }

  public renderSingleRow(context: Visualization.FrameContext): void {
    const { elapsedMillis } = context;

    const ludicrousSpeed = this.ludicrousSpeedButton.value;
    let speed = this.speedDial.value * (ludicrousSpeed ? 5 : 1);
    speed = 0.15; // dials can't be shared across viz, so this is a hack to allow more than one viz to run simultaneously
    this.offset = (this.offset + speed * elapsedMillis) % 360.0;

    const step = 360 / this.width;

    const mid = Math.ceil(this.leds.length / 2);

    for (let i = 0; i < mid; ++i) {
      const hue = this.offset + step * i;
      const color = Colors.hsv(hue, 1, 1);
      this.leds.set(i, color);
      this.leds.set(this.leds.length - 1 - i, color);
    }
  }
}

const factory = new Visualization.Factory({ groupName: GROUP_NAME, name: NAME, ctor: PatternRainbowVisualization });
export default factory;

class DerezPatternRainbowVisualization extends Visualization.DerezVisualization {
  constructor(config: Visualization.Config) {
    super(new PatternRainbowVisualization(config), 0.92);
  }
}

export const DerezPatternRainbowVisualizationFactory  = new Visualization.Factory({ groupName: GROUP_NAME, name: "Derezed Rainbow", ctor: DerezPatternRainbowVisualization });
