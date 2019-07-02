import * as Colors from "../base/Colors";
import * as Visualization from "../base/Visualization";

import * as Utils from "../../util/Utils";

const NAME = "testKeyFade";

const COLOR_PRESSED = Colors.WHITE;
const COLOR_RELEASED = Colors.multiply(Colors.RED, 0.25);

const PALETTE_SIZE = 64;
const PALETTE: Colors.Color[] = Colors.createPaletteFadeLinear(COLOR_RELEASED, COLOR_PRESSED, PALETTE_SIZE);

function colorForValue(v: number) {
  if (v < 0) {
    v = 0;
  } else if (v > 1) {
    v = 1;
  }

  const x = Math.floor(v * (PALETTE_SIZE - 1));
  return PALETTE[x];
}

class TestKeyFadeVisualization extends Visualization.SingleRowVisualization {
  private readonly values: number[];
  private readonly decayRate = 3 / 1000;

  constructor(config: Visualization.Config) {
    super(config, 88);
    this.values = new Array(this.leds.length).fill(0);
  }

  public renderSingleRow(context: Visualization.FrameContext): void {
    const { elapsedMillis, pianoState } = context;

    // decay
    const decayAmount = elapsedMillis * this.decayRate;
    Utils.updateValues(this.values, (oldValue: number) => Math.max(0, oldValue - decayAmount));

    // turn on newly-pressed keys
    pianoState.changedKeys.forEach(n => {
      if (pianoState.keys[n]) {
        this.values[n] = 1;
      }
    });

    // set colors
    this.values.forEach((v, i) => this.leds.set(i, colorForValue(v)));
  }
}

const factory = new Visualization.Factory(NAME, TestKeyFadeVisualization);
export default factory;
