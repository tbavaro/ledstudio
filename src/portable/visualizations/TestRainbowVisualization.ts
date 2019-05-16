import * as Colors from "../base/Colors";
import PianoVisualization, { ColorRow, State } from "../base/PianoVisualization";

export default class TestRainbowVisualization extends PianoVisualization {
  private offset = 0;
  private width = 88; // pixels per 360 degrees
  private speed = 120 / 1000;  // degrees per millis

  constructor(leds: ColorRow) {
    super(leds);
  }

  public render(elapsedMillis: number, state: State): void {
    this.offset = (this.offset + this.speed * elapsedMillis) % 360.0;

    const step = 360 / this.width;

    for (let i = 0; i < this.leds.length; ++i) {
      const hue = this.offset + step * i;
      this.leds[i] = Colors.hsv(hue, 1, 1);
    }
  }
}
