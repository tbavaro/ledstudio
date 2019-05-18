import * as Colors from "../base/Colors";
import * as PianoVisualization from "../base/PianoVisualization";

const COLOR_PRESSED = Colors.WHITE;
const COLOR_RELEASED = Colors.BLACK;

export default class TestKeyVisualization extends PianoVisualization.default {
  constructor() {
    super(88);
  }

  public render(elapsedMillis: number, state: PianoVisualization.State): void {
    state.changedKeys.forEach(n => {
      const isPressed = state.keys[n];
      this.leds.set(n, isPressed ? COLOR_PRESSED : COLOR_RELEASED);
    });
  }
}
