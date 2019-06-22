import Scene from "../../scenes/Scene";

import * as Colors from "../base/Colors";
import * as Visualization from "../base/Visualization";

const COLOR_PRESSED = Colors.WHITE;
const COLOR_RELEASED = Colors.BLACK;

export default class TestKeyVisualization extends Visualization.SingleRowVisualization {
  constructor(scene: Scene) {
    super(scene, 88);
  }

  public renderSingleRow(elapsedMillis: number, state: Visualization.State): void {
    const { pianoState } = state;

    pianoState.changedKeys.forEach(n => {
      const isPressed = pianoState.keys[n];
      this.leds.set(n, isPressed ? COLOR_PRESSED : COLOR_RELEASED);
    });
  }
}
