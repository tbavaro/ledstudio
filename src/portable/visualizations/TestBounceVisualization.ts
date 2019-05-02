import Colors from "../base/Colors";
import LedStrip from "../base/LedStrip";
import PianoVisualization, { State } from "../base/PianoVisualization";

export default class TestBounceVisualization extends PianoVisualization {
  private position: number;
  private index: number;
  private speed: number;  // LEDs per millis

  constructor(ledStrip: LedStrip) {
    ledStrip.reset();
    super(ledStrip);
    this.position = 0;
    this.speed = 50 / 1000;
  }

  public render(elapsedMillis: number, state: State): void {
    const lastLed = this.ledStrip.size - 1;
    const oldIndex = this.index;
    this.position += this.speed * elapsedMillis;
    if (this.position < 0) {
      this.position = (-1 * this.position) % lastLed;
      this.speed = -1 * this.speed;
    } else if (this.position > lastLed) {
      this.position = lastLed - (this.position % lastLed);
      this.speed = -1 * this.speed;
    }
    this.index = Math.floor(this.position);
    this.ledStrip.setColor(oldIndex, Colors.BLACK);
    this.ledStrip.setColor(this.index, Colors.WHITE);
  }
}
