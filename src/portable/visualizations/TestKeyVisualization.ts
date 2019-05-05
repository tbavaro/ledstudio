import * as Colors from "../base/Colors";
import LedStrip from "../base/LedStrip";
import * as PianoVisualization from "../base/PianoVisualization";
import StandardPianoVisualization from "../base/StandardPianoVisualization";

const COLOR_PRESSED = Colors.WHITE;
const COLOR_RELEASED = Colors.BLACK;

export default class TestKeyVisualization extends StandardPianoVisualization {
  constructor(ledStrip: LedStrip) {
    super(ledStrip);
    ledStrip.reset(COLOR_RELEASED);
  }

  public render(elapsedMillis: number, state: PianoVisualization.State): void {
    state.changedKeys.forEach(n => {
      const isPressed = state.keys[n];
      this.frontLedStrip.setColor(n, isPressed ? COLOR_PRESSED : COLOR_RELEASED);
    });
  }
}
