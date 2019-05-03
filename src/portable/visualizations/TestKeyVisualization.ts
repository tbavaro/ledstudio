import * as Colors from "../base/Colors";
import LedStrip from "../base/LedStrip";
import PianoVisualization, { State } from "../base/PianoVisualization";

const COLOR_PRESSED = Colors.WHITE;
const COLOR_RELEASED = Colors.BLACK;

export default class TestKeyVisualization extends PianoVisualization {
  constructor(ledStrip: LedStrip) {
    super(ledStrip);
    ledStrip.reset(COLOR_RELEASED);
  }

  public render(elapsedMillis: number, state: State): void {
    state.changedKeys.forEach(n => {
      const isPressed = state.keys[n];
      this.ledStrip.setColor(n, isPressed ? COLOR_PRESSED : COLOR_RELEASED);
    });
  }
}
