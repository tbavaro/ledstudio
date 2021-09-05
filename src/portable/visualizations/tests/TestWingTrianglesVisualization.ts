import { fillArray } from "src/util/Utils";

import * as Colors from "../../base/Colors";
import { Color } from "../../base/Colors";
import * as Visualization from "../../base/Visualization";

const COUNT_LED_OFFSET = 8;

export default class TestWingTrianglesVisualization extends Visualization.default {
  private readonly ledConfigs: ReadonlyArray<{
    baseColor: Color;
  }>;

  constructor(config: Visualization.Config) {
    super(config);

    let maxTriangleIdx = 0;
    let maxIndexForChannel: { [channel: number]: number } = {};

    // let maxChannel = 0;
    const leds = config.scene.ledMetadatas;

    const myData = leds.map(led => {
      const hci = led.hardwareChannel - 1;
      const rib = Math.floor((hci % 8) / 2);
      const triangle = Math.floor(hci / 8) * 2 + (hci % 2);
      if (triangle > maxTriangleIdx) {
        maxTriangleIdx = triangle;
      }

      if (led.hardwareIndex > (maxIndexForChannel[led.hardwareChannel] ?? -1)) {
        maxIndexForChannel[led.hardwareChannel] = led.hardwareIndex;
      }

      return { rib, triangle };
    });

    const triangleHues: number[] = [];
    const triangleHueStep = 360 / (maxTriangleIdx + 1);
    for (let i = 0; i <= maxTriangleIdx; ++i) {
      triangleHues.push(triangleHueStep * i);
    }

    this.ledConfigs = fillArray(leds.length, i => {
      const myLedData = myData[i];
      const { hardwareIndex, hardwareChannel } = leds[i];
      const isCountLed =
        hardwareIndex >= COUNT_LED_OFFSET &&
        hardwareIndex <= myLedData.rib + COUNT_LED_OFFSET;

      if (isCountLed) {
        return Colors.WHITE;
      }

      const isFirstOrLastLed =
        hardwareIndex === 0 ||
        hardwareIndex === maxIndexForChannel[hardwareChannel];

      return Colors.hsv(
        triangleHues[myLedData.triangle],
        1,
        isFirstOrLastLed ? 1 : 0.1
      );
    }).map(c => ({ baseColor: c }));
  }

  public render(_: Visualization.FrameContext): void {
    for (let i = 0; i < this.ledColors.length; ++i) {
      const ledConfig = this.ledConfigs[i];
      this.ledColors.set(i, ledConfig.baseColor);
    }
  }
}
