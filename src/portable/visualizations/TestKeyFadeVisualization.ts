import * as Colors from "../base/Colors";
import * as PianoVisualization from "../base/PianoVisualization";

import * as BurrowSceneHelpers from "../BurrowSceneHelpers";
import * as Utils from "../Utils";

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

export default class TestKeyFadeVisualization extends PianoVisualization.default {
  private readonly values: number[];
  private readonly decayRate = 3 / 1000;
  private readonly singleRowLeds: PianoVisualization.ColorRow;

  constructor(leds: PianoVisualization.ColorRow) {
    super(leds);
    this.singleRowLeds = new Array(88).fill(colorForValue(0));
    this.values = new Array(this.singleRowLeds.length).fill(0);
  }

  public render(elapsedMillis: number, state: PianoVisualization.State): void {
    // decay
    const decayAmount = elapsedMillis * this.decayRate;
    Utils.updateValues(this.values, (oldValue: number) => Math.max(0, oldValue - decayAmount));

    // turn on newly-pressed keys
    state.changedKeys.forEach(n => {
      if (state.keys[n]) {
        this.values[n] = 1;
      }
    });

    // set colors
    this.values.forEach((v, i) => this.singleRowLeds[i] = colorForValue(v));

    BurrowSceneHelpers.copySingleRow(this.singleRowLeds, this.leds);
  }
}
