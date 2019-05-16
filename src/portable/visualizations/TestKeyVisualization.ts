import * as Colors from "../base/Colors";
import * as PianoVisualization from "../base/PianoVisualization";

import * as BurrowSceneHelpers from "../BurrowSceneHelpers";

const COLOR_PRESSED = Colors.WHITE;
const COLOR_RELEASED = Colors.BLACK;

export default class TestKeyVisualization extends PianoVisualization.default {
  private readonly singleRowLeds: PianoVisualization.ColorRow;

  constructor(leds: PianoVisualization.ColorRow) {
    super(leds);
    this.singleRowLeds = new Array(88).fill(COLOR_RELEASED);
  }

  public render(elapsedMillis: number, state: PianoVisualization.State): void {
    state.changedKeys.forEach(n => {
      const isPressed = state.keys[n];
      this.singleRowLeds[n] =  isPressed ? COLOR_PRESSED : COLOR_RELEASED;
    });
    BurrowSceneHelpers.copySingleRow(this.singleRowLeds, this.leds);
  }
}
