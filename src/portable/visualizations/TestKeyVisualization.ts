import * as Colors from "../base/Colors";
import * as Visualization from "../base/Visualization";

const COLOR_PRESSED = Colors.WHITE;
const COLOR_RELEASED = Colors.BLACK;

export default class TestKeyVisualization extends Visualization.SingleRowVisualization {
  constructor(config: Visualization.Config) {
    super(config, 88);
  }

  public renderSingleRow(context: Visualization.FrameContext): void {
    const { pianoState } = context;

    pianoState.changedKeys.forEach(n => {
      const isPressed = pianoState.keys[n];
      this.leds.set(n, isPressed ? COLOR_PRESSED : COLOR_RELEASED);
    });
  }
}
