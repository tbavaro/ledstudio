import ColorRow from "../base/ColorRow";
import * as Colors from "../base/Colors";
import * as Visualization from "../base/Visualization";

import * as Utils from "../../util/Utils";

const NAME = "glowWave";

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

interface FadingColor {
  initialColor: Colors.Color;
  brightness: number;
}

class GlowWaveVisualization extends Visualization.default {
  private readonly pressedKeyColors = new Map<number, FadingColor>();
  private readonly fadeFactors: number[];
  private readonly nativeRows: ColorRow[];

  constructor(config: Visualization.Config) {
    super(config);
    const scene = config.scene;
    const middleRow = Math.floor(scene.leds.length / 2);
    this.fadeFactors = scene.leds.map((_, i) => Math.pow((1 - ROW_FADE_FACTOR), Math.abs(i - middleRow)));
    this.nativeRows = scene.leds.map(_ => new ColorRow(NATIVE_WIDTH));
  }

  public render(context: Visualization.FrameContext): void {
    const { elapsedMillis, pianoState } = context;

    // decay the unpressed keys
    this.pressedKeyColors.forEach((fc, n) => {
      if (!pianoState.keys[n]) {
        fc.brightness *= 1 - (FADE_DROPOFF * elapsedMillis / 1000);
        if (fc.brightness < 0.01) {
          this.pressedKeyColors.delete(n);
        }
      }
    });

    // assign colors to newly pressed keys
    pianoState.changedKeys.forEach(n => {
      if (pianoState.keys[n]) {
        const initialValue = Utils.bracket01(pianoState.keyVelocities[n] / MAX_BRIGHTNESS_VELOCITY);
        this.pressedKeyColors.set(n, { initialColor: Colors.hsv(n * 10, 1, 1), brightness: initialValue });
      }
    });

    // overshoot so edges get glow even if the wave center is out of bounds
    const min = -1 * WAVE_SPACING;
    const max = NATIVE_WIDTH + WAVE_SPACING;

    const colors = new ColorRow(NATIVE_WIDTH);
    this.pressedKeyColors.forEach((fc, n) => {

      doSymmetric(n, WAVE_SPACING, min, max, (waveCenter: number, waveNum: number) => {
        const waveBrightness = fc.brightness * Math.pow(1 - WAVE_DROPOFF, waveNum);
        doSymmetric(waveCenter, 1, min, max, (pos: number, step: number) => {
          if (pos >= 0 && pos < colors.length) {
            const brightness = waveBrightness * Math.pow(1 - LED_DROPOFF, step);
            if (brightness > 0.01) {
              const ledColor = Colors.multiply(fc.initialColor, brightness);
              colors.add(pos, ledColor);
            }
          }
        });
      });
    });

    this.nativeRows.forEach((row, i) => {
      row.copyFancy(colors, { derezAmount: DEREZ, multiplyBy: this.fadeFactors[i] });

      const outputRow = this.ledRows.get(i);
      row.copy(outputRow, Math.floor((outputRow.length - row.length) / 2));
    });
  }
}

const factory = new Visualization.Factory(NAME, GlowWaveVisualization);
export default factory;
