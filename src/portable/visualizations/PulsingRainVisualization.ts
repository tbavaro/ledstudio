import * as Scene from "../../scenes/Scene";
import * as Colors from "../base/Colors";
import * as Visualization from "../base/Visualization";
import * as AudioWaveformSampler from "./util/AudioWaveformSampler";

const NAME = "pulsingRain";

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

class PulsingRainVisualization extends Visualization.default {
  private readonly dropHelper: DropHelper;
  private readonly sparkles: Set<Sparkle>;
  private readonly analyserHelper: ReturnType<typeof AudioWaveformSampler.createAnalyserHelpers> | null;
  private readonly ezTS: Visualization.EasyTimeSeriesValueSetters;
  private numSparklesRemainder = 0;
  private lastDrop = 0;

  constructor(config: Visualization.Config) {
    super(config);
    this.dropHelper = new DropHelper(config.scene.leds);
    this.sparkles = new Set();

    const audioSource = config.audioSource;
    if (audioSource !== null) {
      this.analyserHelper = AudioWaveformSampler.createAnalyserHelpers(audioSource);
    } else {
      this.analyserHelper = null;
    }

    this.ezTS = config.createEasyTimeSeriesSet();
  }

  public render(context: Visualization.FrameContext): void {
    if (this.analyserHelper == null) {
      return;
    }

    const { elapsedSeconds, beatController } = context;
    const now = Date.now()/1000;

    this.analyserHelper.direct.sample();
    this.analyserHelper.low.sample();

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

    const volumeAdjustment = (this.analyserHelper.direct.currentRMSAmplitude - 0.25) * 800;
    let sparkleRate = BASE_SPARKLES_PER_SECOND + volumeAdjustment;

    const nearBeat = beatController.timeSinceLastBeat() < 0.1 || beatController.progressToNextBeat() > 0.95;
    if (this.analyserHelper.low.currentRmsEma3.zScore > 4 && nearBeat) {
      this.lastDrop = now;
    }
    // beat brightness multiplier
    let beatMultiplier = 0.75;
    if (now - this.lastDrop < 8) {
      beatMultiplier = (beatController.progressToNextBeat() - 0.5) * 2 * 0.8;
      sparkleRate = 400;
    }

    // new sparkles
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

    this.ezTS.blue.value = this.analyserHelper.direct.currentRmsEma3.zScore/4;
    this.ezTS.green.value = now - this.lastDrop < 8 ? 1 : 0;

    // render

    const multiplier = Math.pow(0.5, elapsedSeconds / SPARKLE_HALF_LIFE_SECONDS);
    this.ledRows.forEach(row => row.forEach((color, i) => row.set(i, Colors.multiply(color, multiplier))));

    this.sparkles.forEach(sparkle => {
      this.ledRows.get(sparkle.address.rowIndex).add(sparkle.address.index, Colors.multiply(sparkle.color, beatMultiplier));
    });
  }
}

const factory = new Visualization.Factory(NAME, PulsingRainVisualization);
export default factory;
