import ColorRow from "../base/ColorRow";
import * as Colors from "../base/Colors";
import * as PianoVisualization from "../base/PianoVisualization";

import * as Utils from "../Utils";

const NATIVE_WIDTH = 88;
const ROW_FADE_FACTOR = 0.6;

const WAVE_SPACING = 18;
const WAVE_DROPOFF = 0.7;
const LED_DROPOFF = 0.2;
const FADE_DROPOFF = 3.0;
const DEREZ = 0.7;

// full brightness requires at least this velocity
const MAX_BRIGHTNESS_VELOCITY = 0.6;

// starting at n, call func outward in + and - directions, until passing min/max
function doSymmetric(n: number, stepSize: number, min: number, max: number, func: (v: number, steps: number) => void) {
  if (n < min || n > max) {
    return;
  }
  func(n, 0);
  [-1, 1].forEach(direction => {
    let step = 1;
    let v = n + step * direction * stepSize;
    while (v >= min && v <= max) {
      func(v, step);
      step++;
      v += direction * stepSize;
    }
  });
}

export default class GlowWaveVisualization extends PianoVisualization.default {
  private readonly pressedKeyColors = new Map<number, Colors.Color>();
  private readonly fadeFactors: number[];

  constructor(numLeds: number[]) {
    super(numLeds.map(_ => NATIVE_WIDTH));
    const middleRow = Math.floor(numLeds.length / 2);
    this.fadeFactors = numLeds.map((_, i) => Math.pow((1 - ROW_FADE_FACTOR), Math.abs(i - middleRow)));
  }

  public render(elapsedMillis: number, state: PianoVisualization.State): void {
    // decay the unpressed keys
    this.pressedKeyColors.forEach((c, n) => {
      if (!state.keys[n]) {
        c = Colors.multiply(c, 1 - (FADE_DROPOFF * elapsedMillis / 1000));
        if (c === Colors.BLACK) {
          this.pressedKeyColors.delete(n);
        } else {
          this.pressedKeyColors.set(n, c);
        }
      }
    });

    // assign colors to newly pressed keys
    state.changedKeys.forEach(n => {
      if (state.keys[n]) {
        const initialValue = Utils.bracket01(state.keyVelocities[n] / MAX_BRIGHTNESS_VELOCITY);
        this.pressedKeyColors.set(n, Colors.hsv(n * 10, 1, initialValue));
      }
    });

    // overshoot so edges get glow even if the wave center is out of bounds
    const min = -1 * WAVE_SPACING;
    const max = NATIVE_WIDTH + WAVE_SPACING;

    const colors = new ColorRow(NATIVE_WIDTH);
    this.pressedKeyColors.forEach((color, n) => {
      doSymmetric(n, WAVE_SPACING, min, max, (waveCenter: number, waveNum: number) => {
        const waveColor = Colors.multiply(color, Math.pow(1 - WAVE_DROPOFF, waveNum));
        doSymmetric(waveCenter, 1, min, max, (pos: number, step: number) => {
          if (pos >= 0 && pos < colors.length) {
            const ledColor = Colors.multiply(waveColor, Math.pow(1 - LED_DROPOFF, step));
            colors.add(pos, ledColor);
          }
        });
      });
    });

    this.ledRows.forEach((row, i) => {
      row.copy(colors, { derezAmount: DEREZ, multiplyBy: this.fadeFactors[i] });
    });
  }
}
