import * as Colors from "../../base/Colors";
import * as Visualization from "../../base/Visualization";

const SPARKLES_PER_SECOND = 300;
const SPARKLE_HALF_LIFE_SECONDS = 0.2;

export default class PatternSparklesVisualization extends Visualization.default {
  private numLedsRemainder = 0;

  public render(context: Visualization.FrameContext): void {
    const { elapsedSeconds } = context;

    const multiplier = Math.pow(
      0.5,
      elapsedSeconds / SPARKLE_HALF_LIFE_SECONDS
    );
    this.ledColors.forEach((color, i) =>
      this.ledColors.set(i, Colors.multiply(color, multiplier))
    );

    let numLeds = this.numLedsRemainder + elapsedSeconds * SPARKLES_PER_SECOND;
    while (numLeds >= 1) {
      const n = Math.floor(Math.random() * this.ledColors.length);
      this.ledColors.set(n, Colors.WHITE);
      numLeds -= 1;
    }
    this.numLedsRemainder = numLeds;
  }
}
