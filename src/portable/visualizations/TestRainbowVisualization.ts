import * as Colors from "../base/Colors";
import LedStrip from "../base/LedStrip";
import PianoVisualization, { State } from "../base/PianoVisualization";

export default class TestRainbowVisualization extends PianoVisualization {
  private ledStrip: LedStrip;
  private offset = 0;
  private width = 88; // pixels per 360 degrees
  private speed = 120 / 1000;  // degrees per millis

  constructor(ledStrip: LedStrip) {
    super();
    this.ledStrip = ledStrip;
    ledStrip.reset();
  }

  public render(elapsedMillis: number, state: State): void {
    this.offset = (this.offset + this.speed * elapsedMillis) % 360.0;

    const step = 360 / this.width;

    for (let i = 0; i < this.ledStrip.size; ++i) {
      const hue = this.offset + step * i;
      this.ledStrip.setColor(i, Colors.hsv(hue, 1, 1));
    }
  }
}
