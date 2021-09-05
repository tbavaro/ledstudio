import * as Three from "three";
import { Vector3 } from "three";

import { createBurrowVenue } from "./BurrowVenue";
import * as Scene from "./Scene";
import SceneDef, { LedsDef } from "./SceneDef";

function makeLedSegments(
  segments: Array<{
    numLeds: number;
    startPoint: Three.Vector3;
    endPoint: Three.Vector3;
    hardwareChannel: number;
  }>,
  firstRowHint?: number
): LedsDef {
  const rowHintOffset = firstRowHint || 0;
  return {
    calculate: () => {
      const ledMetadatas: Scene.LedMetadata[] = [];
      segments.forEach((segment, rowIndex) => {
        const numLeds = segment.numLeds;
        const step = segment.endPoint.clone();
        step.sub(segment.startPoint);
        step.divideScalar(segment.numLeds - 1);
        for (let i = 0; i < numLeds; ++i) {
          const position = step.clone();
          position.multiplyScalar(i);
          position.add(segment.startPoint);
          const led: Scene.LedMetadata = {
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
  };
}

export function createPianoThreeStripesScene(name: string): SceneDef {
  return {
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
  };
}
