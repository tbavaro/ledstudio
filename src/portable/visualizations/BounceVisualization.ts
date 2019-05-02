import * as Colors from "../base/Colors";
import LedStrip from "../base/LedStrip";
import PianoVisualization, { State } from "../base/PianoVisualization";

export default class BounceVisualization extends PianoVisualization {
  private position: number;
  private index: number;
  private speed: number;

  constructor(ledStrip: LedStrip) {
    ledStrip.reset();
    super(ledStrip);
    this.position = 0;
    this.speed = 1;
  }

  public render(elapsedMillis: number, state: State): void {
    const oldIndex = this.index;
    this.position += this.speed * elapsedMillis;
    if (this.position < 0) {
      this.position = (-1 * this.position) % this.ledStrip.size;
      this.speed = -1 * this.speed;
    } else if (this.position > (this.ledStrip.size - 1)) {
      this.position = (this.ledStrip.size - 1) - (this.position % this.ledStrip.size);
      this.speed = -1 * this.speed;
    }
    this.index = Math.round(this.position);
    this.ledStrip.setColor(oldIndex, Colors.BLACK);
    this.ledStrip.setColor(this.index, Colors.RED);
  }
}
