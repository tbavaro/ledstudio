import * as Scene from "../../../scenes/Scene";

import * as Colors from "../../base/Colors";
import * as Visualization from "../../base/Visualization";

const CONSTANT_SPARKLE_RATE = 0;
const MIN_SPARKLES_PER_BEAT = 5;
const MAX_SPARKLES_PER_BEAT = 40;
const SPARKLE_HALF_LIFE_SECONDS = 0.05;
const FALL_MILLIS = 70;
const TOP_GLOW = Colors.hsv(210, 1, 0.01);

const DEREZ = 0.8;

interface LedAddress {
  rowIndex: number;
  index: number;
}

interface Sparkle {
  address: LedAddress;
  color: Colors.Color;
  millisUntilFall: number;
}

class DropHelper {
  private readonly fallGraph: LedAddress[][][];

  constructor(ledRows: Scene.LedInfo[][]) {
    // construct "fall graph"; every location maps to the 0, 1, or 2 places it could fall to;
    // that is, the next row's nearest LEDs down and to the left/right of this one
    this.fallGraph = ledRows.map((ledRow, rowIndex) => {
      const nextRow: Scene.LedInfo[] | undefined = ledRows[rowIndex + 1];
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

class PureVisualization extends Visualization.default {
  private readonly dropHelper: DropHelper;
  private readonly sparkles: Set<Sparkle>;
  private readonly ts: Visualization.EasyTimeSeriesValueSetters;

  constructor(config: Visualization.Config) {
    super(config);
    this.dropHelper = new DropHelper(config.scene.leds);
    this.sparkles = new Set();

    this.ts = config.createEasyTimeSeriesSet();
  }

  public render(context: Visualization.FrameContext): void {
    const { signals } = this.config;
    const { elapsedSeconds } = context;

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
        }
      }
    });
    deadSparkles.forEach(sparkle => this.sparkles.delete(sparkle));

    // new sparkles
    const numSparkles = (
      signals.isNewBeat
        ? signals.lowLevel * (MAX_SPARKLES_PER_BEAT - MIN_SPARKLES_PER_BEAT) + MIN_SPARKLES_PER_BEAT
        : CONSTANT_SPARKLE_RATE * elapsedSeconds
    );
    for (let i = 0; i < numSparkles; ++i) {
      const sparkle: Sparkle = {
        address: { rowIndex: 0, index: Math.floor(Math.random() * this.ledRows.get(0).length) },
        color: Colors.hsv(200 + Math.random() * 45, Math.pow(Math.random(), 0.2), Math.random() * 0.5 + 0.5),
        millisUntilFall: FALL_MILLIS
      };
      this.sparkles.add(sparkle);
    }
    this.ts.red.value = numSparkles / MAX_SPARKLES_PER_BEAT;

    // render

    const multiplier = Math.pow(0.5, elapsedSeconds / SPARKLE_HALF_LIFE_SECONDS);
    this.ledRows.forEach(row => row.forEach((color, i) => row.set(i, Colors.multiply(color, multiplier))));

    // this.ledRows.forEach(ledRow => ledRow.fill(Colors.BLACK));
    this.sparkles.forEach(sparkle => {
      this.ledRows.get(sparkle.address.rowIndex).set(sparkle.address.index, sparkle.color);
    });

    const topRow = this.ledRows.get(0);
    topRow.forEach((color, i) => topRow.set(i, Colors.add(color, TOP_GLOW)));
  }
}

export default class MyVisualization extends Visualization.DerezVisualization {
  constructor(config: Visualization.Config) {
    super(new PureVisualization(config), DEREZ);
  }
}
