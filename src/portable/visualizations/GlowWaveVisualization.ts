import * as Colors from "../base/Colors";
import LedStrip from "../base/LedStrip";
import * as PianoVisualization from "../base/PianoVisualization";

import * as BurrowSceneHelpers from "../BurrowSceneHelpers";
import { DerezLedStrip } from "../CompositeLedStrips";
import * as Utils from "../Utils";

const WAVE_SPACING = 18;
const WAVE_DROPOFF = 0.7;
const LED_DROPOFF = 0.2;
const FADE_DROPOFF = 3.0;
const DEREZ = 0.6;

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
  private readonly frontLedStrip: LedStrip;
  private readonly applyDerez: () => void;

  constructor(ledStrip: LedStrip) {
    super();

    // do everything derezed
    const derezLedStrip = new DerezLedStrip(ledStrip, DEREZ);
    this.applyDerez = () => derezLedStrip.apply();

    derezLedStrip.reset(Colors.BLACK);
    this.frontLedStrip = BurrowSceneHelpers.createBurrowSingleRowLedStrip(derezLedStrip, 0.5);
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
    const max = this.frontLedStrip.size + WAVE_SPACING;

    const colors = new Array<Colors.Color>(this.frontLedStrip.size).fill(Colors.BLACK);
    this.pressedKeyColors.forEach((color, n) => {
      doSymmetric(n, WAVE_SPACING, min, max, (waveCenter: number, waveNum: number) => {
        const waveColor = Colors.multiply(color, Math.pow(1 - WAVE_DROPOFF, waveNum));
        doSymmetric(waveCenter, 1, min, max, (pos: number, step: number) => {
          if (pos >= 0 && pos < this.frontLedStrip.size) {
            const ledColor = Colors.multiply(waveColor, Math.pow(1 - LED_DROPOFF, step));
            colors[pos] = Colors.add(colors[pos], ledColor);
          }
        });
      });
    });

    colors.forEach((c, i) => this.frontLedStrip.setColor(i, c));
    this.applyDerez();
  }
}
