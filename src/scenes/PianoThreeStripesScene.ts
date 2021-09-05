import * as Three from "three";
import { Vector3 } from "three";

import { createBurrowVenue } from "./BurrowVenue";
import Scene, { SceneLedMetadata } from "./Scene";

function makeLedSegments(
  segments: Array<{
    numLeds: number;
    startPoint: Three.Vector3;
    endPoint: Three.Vector3;
    hardwareChannel: number;
  }>,
  firstRowHint?: number
): SceneLedMetadata[] {
  const rowHintOffset = firstRowHint || 0;
  const ledMetadatas: SceneLedMetadata[] = [];
  segments.forEach((segment, rowIndex) => {
    const numLeds = segment.numLeds;
    const step = segment.endPoint.clone();
    step.sub(segment.startPoint);
    step.divideScalar(segment.numLeds - 1);
    for (let i = 0; i < numLeds; ++i) {
      const position = step.clone();
      position.multiplyScalar(i);
      position.add(segment.startPoint);
      const led: SceneLedMetadata = {
        position: position,
        hardwareChannel: segment.hardwareChannel,
        hardwareIndex: i,
        rowHint: rowHintOffset + rowIndex
      };
      ledMetadatas.push(led);
    }
  });
  return ledMetadatas;
}

export default class PianoThreeStripesScene extends Scene {
  public constructor(name: string) {
    super({
      ...createBurrowVenue({ keyboardInFront: true }),
      name,
      camera: {
        startPosition: new Vector3(0, 1.1, -1.5),
        target: new Vector3(0, 0.5, 0)
      },
      leds: makeLedSegments([
        {
          numLeds: 88,
          startPoint: new Three.Vector3(-0.6, 0.74, -0.163),
          endPoint: new Three.Vector3(0.6, 0.74, -0.163),
          hardwareChannel: 1
        },
        {
          numLeds: 88,
          startPoint: new Three.Vector3(-0.6, 0.725, -0.168),
          endPoint: new Three.Vector3(0.6, 0.725, -0.168),
          hardwareChannel: 2
        },
        {
          numLeds: 88,
          startPoint: new Three.Vector3(-0.6, 0.71, -0.173),
          endPoint: new Three.Vector3(0.6, 0.71, -0.173),
          hardwareChannel: 3
        }
      ]),
      ledRadius: 0.0035
    });
  }
}
