import * as Colors from "../base/Colors";
import * as Visualization from "../base/Visualization";

const GROUP_NAME = "patterns";
const NAME = "pattern:sparkles";

const SPARKLES_PER_SECOND = 300;
const SPARKLE_HALF_LIFE_SECONDS = 0.2;

class PatternSparklesVisualization extends Visualization.default {
  private readonly ledAddresses: Array<[number, number]>;
  private numLedsRemainder = 0;

  constructor(config: Visualization.Config) {
    super(config);

    this.ledAddresses = [];
    config.scene.leds.forEach((row, rowNum) => row.forEach((_, i) => this.ledAddresses.push([rowNum, i])));
  }

  public render(context: Visualization.FrameContext): void {
    const { elapsedSeconds } = context;

    const multiplier = Math.pow(0.5, elapsedSeconds / SPARKLE_HALF_LIFE_SECONDS);
    this.ledRows.forEach(row => row.forEach((color, i) => row.set(i, Colors.multiply(color, multiplier))));

    let numLeds = this.numLedsRemainder + elapsedSeconds * SPARKLES_PER_SECOND;
    while (numLeds >= 1) {
      const n = Math.floor(Math.random() * this.ledAddresses.length);
      const [row, index] = this.ledAddresses[n];
      this.ledRows.get(row).set(index, Colors.WHITE);
      numLeds -= 1;
    }
    this.numLedsRemainder = numLeds;
  }
}

const factory = new Visualization.Factory({ groupName: GROUP_NAME, name: NAME, ctor: PatternSparklesVisualization });
export default factory;
