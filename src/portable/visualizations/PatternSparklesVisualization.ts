import Scene from "../../scenes/Scene";

import * as Colors from "../base/Colors";
import * as PianoVisualization from "../base/PianoVisualization";

const SPARKLES_PER_SECOND = 300;
const SPARKLE_HALF_LIFE_SECONDS = 0.2;

export default class PatternSparklesVisualization extends PianoVisualization.default {
  private readonly ledAddresses: Array<[number, number]>;
  private numLedsRemainder = 0;

  constructor(scene: Scene) {
    super(scene);

    this.ledAddresses = [];
    scene.leds.forEach((row, rowNum) => row.forEach((_, i) => this.ledAddresses.push([rowNum, i])));
  }

  public render(elapsedMillis: number, state: PianoVisualization.State, context: PianoVisualization.Context): void {
    const multiplier = Math.pow(0.5, elapsedMillis / 1000 / SPARKLE_HALF_LIFE_SECONDS);
    this.ledRows.forEach(row => row.forEach((color, i) => row.set(i, Colors.multiply(color, multiplier))));

    let numLeds = this.numLedsRemainder + elapsedMillis / 1000 * SPARKLES_PER_SECOND;
    while (numLeds >= 1) {
      const n = Math.floor(Math.random() * this.ledAddresses.length);
      const [row, index] = this.ledAddresses[n];
      this.ledRows.get(row).set(index, Colors.WHITE);
      numLeds -= 1;
    }
    this.numLedsRemainder = numLeds;
  }
}
