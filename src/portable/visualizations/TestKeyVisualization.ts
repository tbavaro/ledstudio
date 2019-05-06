import * as Colors from "../base/Colors";
import LedStrip from "../base/LedStrip";
import * as PianoVisualization from "../base/PianoVisualization";

import * as BurrowSceneHelpers from "../BurrowSceneHelpers";

const COLOR_PRESSED = Colors.WHITE;
const COLOR_RELEASED = Colors.BLACK;

export default class TestKeyVisualization extends PianoVisualization.default {
  private readonly frontLedStrip: LedStrip;

  constructor(ledStrip: LedStrip) {
    super();
    ledStrip.reset(COLOR_RELEASED);

    this.frontLedStrip = BurrowSceneHelpers.createBurrowSingleRowLedStrip(ledStrip, 0);
  }

  public render(elapsedMillis: number, state: PianoVisualization.State): void {
    state.changedKeys.forEach(n => {
      const isPressed = state.keys[n];
      this.frontLedStrip.setColor(n, isPressed ? COLOR_PRESSED : COLOR_RELEASED);
    });
  }
}
