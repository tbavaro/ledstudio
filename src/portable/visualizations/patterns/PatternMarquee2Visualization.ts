import LedMetadata from "src/portable/base/LedMetadata";
import { first, pushAll } from "src/util/Utils";

import * as Colors from "../../base/Colors";
import * as Visualization from "../../base/Visualization";

const LED_SEPARATION = 18;
const SPEED = 60; // LEDs per second

function getIndexesGroupedByHardwareChannel(leds: readonly LedMetadata[]) {
  const results: number[][] = [];

  leds.forEach((led, i) => {
    const c = led.hardwareChannel;
    while (results.length <= c) {
      results.push([]);
    }

    results[c].push(i);
  });

  return results;
}

export default class PatternMarquee2Visualization extends Visualization.default {
  private readonly paths: number[][];
  private phase = 0;

  constructor(config: Visualization.Config) {
    super(config);
    this.paths = PatternMarquee2Visualization.generateGaragePaths(
      config.scene.ledMetadatas
    );
  }

  private static generateGaragePaths(ledRowMetadatas: LedMetadata[]) {
    const indexesByHardwareChannel =
      getIndexesGroupedByHardwareChannel(ledRowMetadatas);

    const headPath: number[] = [];

    pushAll(headPath, [...indexesByHardwareChannel[1]].reverse());
    pushAll(headPath, indexesByHardwareChannel[9]);
    [11, 13, 15, 7, 5, 3].reverse().forEach(n => {
      for (let i = 0; i < 1; ++i) {
        headPath.push(first(indexesByHardwareChannel[n]));
      }
    });

    return [headPath];
  }

  public render(context: Visualization.FrameContext): void {
    const { elapsedSeconds } = context;
    this.phase = (this.phase + SPEED * elapsedSeconds) % LED_SEPARATION;
    const offset = Math.round(this.phase);

    this.paths.forEach(path =>
      path.forEach((ledAddress, i) => {
        const color =
          (i + offset) % LED_SEPARATION === 0 ? Colors.WHITE : Colors.BLACK;
        this.ledColors.set(ledAddress, color);
      })
    );
  }
}
