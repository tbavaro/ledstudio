import Scene from "../../scenes/Scene";

import * as Colors from "../base/Colors";
import * as Visualization from "../base/Visualization";

const LED_SEPARATION = 3;
const SPEED = 10; // LEDs per second

export default class PatternSparklesVisualization extends Visualization.default {
  private readonly ledAddresses: Array<[number, number]>;
  private phase = 0;

  constructor(scene: Scene) {
    super(scene);

    this.ledAddresses = [];
    scene.leds[0].forEach((_, i) => this.ledAddresses.push([0, i]));
    const bottomRow = scene.leds.length - 1;
    const bottomRowCount = scene.leds[bottomRow].length;
    scene.leds[bottomRow].forEach((_, i) => this.ledAddresses.push([bottomRow, bottomRowCount - i - 1]));
  }

  public render(elapsedMillis: number, state: Visualization.State, context: Visualization.Context): void {
    this.phase = (this.phase + SPEED * elapsedMillis / 1000) % LED_SEPARATION;
    const offset = Math.round(this.phase);
    this.ledAddresses.forEach((ledAddress, i) => {
      const [row, index] = ledAddress;
      const color = ((i + offset) % LED_SEPARATION === 0) ? Colors.WHITE : Colors.BLACK;
      this.ledRows.get(row).set(index, color);
    });
  }
}