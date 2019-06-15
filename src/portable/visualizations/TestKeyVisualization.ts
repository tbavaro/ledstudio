import Scene from "../../scenes/Scene";

import * as Colors from "../base/Colors";
import * as PianoVisualization from "../base/PianoVisualization";

const COLOR_PRESSED = Colors.WHITE;
const COLOR_RELEASED = Colors.BLACK;

export default class TestKeyVisualization extends PianoVisualization.SingleRowPianoVisualization {
  constructor(scene: Scene) {
    super(scene, 88);
  }

  public renderSingleRow(elapsedMillis: number, state: PianoVisualization.State): void {
    const { pianoState } = state;

    pianoState.changedKeys.forEach(n => {
      const isPressed = pianoState.keys[n];
      this.leds.set(n, isPressed ? COLOR_PRESSED : COLOR_RELEASED);
    });
  }
}
