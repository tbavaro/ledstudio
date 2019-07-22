import * as Scene from "../../../scenes/Scene";
import * as Colors from "../../base/Colors";
import * as Visualization from "../../base/Visualization";
import { SignalsHelper } from "../../visualizationUtils/SignalsHelper";

const BASE_SPARKLES_PER_SECOND = 200;
const SPARKLE_HALF_LIFE_SECONDS = 0.2;
const FALL_MILLIS = 100;

interface LedAddress {
  rowIndex: number;
  index: number;
}

interface Sparkle {
  address: LedAddress;
  color: Colors.Color;
  fadeRate: number;  // 0-1
  millisUntilFall: number;
}

class DropHelper {
  private readonly fallGraph: LedAddress[][][];

  constructor(ledRows: Scene.LedMetadata[][]) {
    // construct "fall graph"; every location maps to the 0, 1, or 2 places it could fall to;
    // that is, the next row's nearest LEDs down and to the left/right of this one
    this.fallGraph = ledRows.map((ledRow, rowIndex) => {
      const nextRow: Scene.LedMetadata[] | undefined = ledRows[rowIndex + 1];
      const makeAddress = (index: number) => ({ rowIndex: rowIndex + 1, index });
      return ledRow.map(led => {
        if (nextRow === undefined || nextRow.length === 0) {
          return [];
        }
        // find the index of the first LED in the next row that's further to the right (x dim) than this one
        let i: number;
        for (i = 0; i < nextRow.length && nextRow[i].position.x < led.position.x; ++i) {
          // no-op
        }
        if (i === 0) {
          return [makeAddress(0)];
        } else if (i >= nextRow.length) {
          return [makeAddress(nextRow.length - 1)];
        } else {
          return [makeAddress(i - 1), makeAddress(i)];
        }
      });
    });
  }

  public drop(address: LedAddress): LedAddress | null {
    const targets = (this.fallGraph[address.rowIndex] || [])[address.index] || [];
    if (targets.length === 0) {
      return null;
    } else {
      return targets[Math.floor(Math.random() * targets.length)];
    }
  }
}

export default class PulsingRainVisualization extends Visualization.default {
  private readonly dropHelper: DropHelper;
  private readonly sparkles: Set<Sparkle>;
  private numSparklesRemainder = 0;
  private signals: SignalsHelper;

  constructor(config: Visualization.Config) {
    super(config);
    this.dropHelper = new DropHelper(config.scene.ledMetadatas);
    this.sparkles = new Set();

    this.signals = new SignalsHelper(config.audioSource);
  }

  public render(context: Visualization.FrameContext): void {
    const { elapsedSeconds, beatController } = context;
    const now = Date.now()/1000;
    this.signals.update(elapsedSeconds/1000, beatController);

    // drops
    const deadSparkles: Sparkle[] = [];
    this.sparkles.forEach(sparkle => {
      sparkle.millisUntilFall -= elapsedSeconds * 1000;
      if (sparkle.millisUntilFall <= 0) {
        const newAddress = this.dropHelper.drop(sparkle.address);
        if (newAddress === null) {
          deadSparkles.push(sparkle);
        } else {
          sparkle.address = newAddress;
          sparkle.millisUntilFall = FALL_MILLIS;
          sparkle.color = Colors.multiply(sparkle.color, 1 - sparkle.fadeRate);
        }
      }
    });
    deadSparkles.forEach(sparkle => this.sparkles.delete(sparkle));


    // beat brightness multiplier
    let beatMultiplier = 0.75;
    if (this.signals.beatsSinceDrop < 16) {
      beatMultiplier = (beatController.progressToNextBeat() - 0.5) * 2 * 0.8;
    }

    // new sparkles
    const volumeAdjustment = (this.signals.audioValues.unfilteredRMS - 0.25) * 800;
    const sparkleRate = BASE_SPARKLES_PER_SECOND + volumeAdjustment;
    let numLeds = this.numSparklesRemainder + elapsedSeconds * sparkleRate;
    while (numLeds >= 1) {
      const index = Math.floor(Math.random() * this.ledRows.get(0).length);
      const sparkle: Sparkle = {
        address: { rowIndex: 0, index },
        color: Colors.hsv(index + now*90, Math.pow(Math.random(), 0.2), Math.random() * 0.5 + 0.5),
        millisUntilFall: FALL_MILLIS,
        fadeRate: Math.pow(Math.random(), 0.2)
      };
      this.sparkles.add(sparkle);
      numLeds -= 1;
    }
    this.numSparklesRemainder = numLeds;

    // render

    const multiplier = Math.pow(0.5, elapsedSeconds / SPARKLE_HALF_LIFE_SECONDS);
    this.ledRows.forEach(row => row.forEach((color, i) => row.set(i, Colors.multiply(color, multiplier))));

    this.sparkles.forEach(sparkle => {
      this.ledRows.get(sparkle.address.rowIndex).add(sparkle.address.index, Colors.multiply(sparkle.color, beatMultiplier));
    });
  }
}
