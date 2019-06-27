import * as Colors from "../base/Colors";
import * as Visualization from "../base/Visualization";

export default class PatternRainbowVisualization extends Visualization.SingleRowVisualization {
  private offset = 0;
  private width = 88; // pixels per 360 degrees

  private readonly speedDial: Visualization.ControllerDialValueGetter;

  constructor(config: Visualization.Config) {
    super(config, Math.max.apply(Math, config.scene.leds.map(arr => arr.length)));

    this.speedDial = config.createDialControl();
  }

  public renderSingleRow(context: Visualization.FrameContext): void {
    const { elapsedMillis } = context;

    const maxSpeed = 300 / 1000;
    const speed = (this.speedDial.get() - 0.5) * -1 * maxSpeed;
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
