import { INCH, METER } from "src/util/Units";
import { Vector2, Vector3 } from "three";

import * as SimulationUtils from "../simulator/SimulationUtils";
import { createBurrowVenue } from "./BurrowVenue";
import Scene, { SceneLedMetadata } from "./Scene";
import { boxHelper } from "./SceneUtils";

const LED_SPACING = METER / 30;

// measurements
const middleSpacing = 1.5 * INCH;
const interTriangleSpacing = 1.75 * INCH;
const startSpacing = 7.5 * INCH;
const smallDeltaX = 29 * INCH;
const smallDeltaY = 19.5 * INCH;
const largeDeltaX = 57 * INCH;
const largeDeltaY = 48.25 * INCH;
const bottomHeight = 35 * INCH;

function interleave<T>(a: T[], b: T[]): T[] {
  if (a.length !== b.length) {
    throw new Error("must be same length");
  }

  const output: T[] = [];

  a.forEach((ai, i) => {
    output.push(ai);
    output.push(b[i]);
  });

  return output;
}

function createVenue() {
  const postPositionX = smallDeltaX + 0.5 * interTriangleSpacing;

  const venue = createBurrowVenue({
    keyboardInFront: false,
    hideKeyboard: true
  });
  venue.extraObjects.push(
    boxHelper({
      width: 4 * INCH,
      height: 65 * INCH,
      depth: 4 * INCH,
      translateBy: new Vector3(postPositionX, 0, 1.32)
    })
  );
  venue.extraObjects.push(
    boxHelper({
      width: 4 * INCH,
      height: 65 * INCH,
      depth: 4 * INCH,
      translateBy: new Vector3(-1 * postPositionX, 0, 1.32)
    })
  );

  return venue;
}

function calculateLedPositions2d() {
  const makeRib = (attrs: {
    start: Vector2;
    toward: Vector2;
    numLeds: number;
  }) => {
    const end = attrs.toward
      .clone()
      .sub(attrs.start)
      .normalize()
      .multiplyScalar(LED_SPACING * (attrs.numLeds - 1 + 0.1))
      .add(attrs.start);
    return SimulationUtils.pointsFromTo({
      start: attrs.start,
      end: end,
      spacing: LED_SPACING
    });
  };

  const translateBy = (delta: Vector2) => (vs: Vector2[]) =>
    vs.map(v => v.clone().add(delta));

  const smallLeftRibs = [
    makeRib({
      start: new Vector2(0, 3 * startSpacing),
      toward: new Vector2(smallDeltaX, smallDeltaY),
      numLeds: 23
    }),
    makeRib({
      start: new Vector2(0, 2 * startSpacing),
      toward: new Vector2(smallDeltaX, smallDeltaY),
      numLeds: 20
    }),
    makeRib({
      start: new Vector2(0, 1 * startSpacing),
      toward: new Vector2(smallDeltaX, smallDeltaY),
      numLeds: 22
    }),
    makeRib({
      start: new Vector2(0, 0 * startSpacing),
      toward: new Vector2(smallDeltaX, smallDeltaY),
      numLeds: 26
    })
  ].map(translateBy(new Vector2(-1 * (smallDeltaX + middleSpacing * 0.5))));

  const largeLeftRibs = [
    makeRib({
      start: new Vector2(0, 3 * startSpacing),
      toward: new Vector2(-1 * largeDeltaX, largeDeltaY),
      numLeds: 46
    }),
    makeRib({
      start: new Vector2(0, 2 * startSpacing),
      toward: new Vector2(-1 * largeDeltaX, largeDeltaY),
      numLeds: 44
    }),
    makeRib({
      start: new Vector2(0, 1 * startSpacing),
      toward: new Vector2(-1 * largeDeltaX, largeDeltaY),
      numLeds: 44
    }),
    makeRib({
      start: new Vector2(0, 0 * startSpacing),
      toward: new Vector2(-1 * largeDeltaX, largeDeltaY),
      numLeds: 53
    })
  ].map(
    translateBy(
      new Vector2(
        -1 * (smallDeltaX + interTriangleSpacing + middleSpacing * 0.5)
      )
    )
  );

  const allLeftRibs = interleave(smallLeftRibs, largeLeftRibs);

  const flipX = (v: Vector2) => new Vector2(-1 * v.x, v.y);
  const allRightRibs = allLeftRibs.map(rib => rib.map(flipX));

  return [...allLeftRibs, ...allRightRibs];
}

export default class RealWingsScene extends Scene {
  public constructor(name: string) {
    const positions2d = calculateLedPositions2d();
    const ribLengths = positions2d.map(r => r.length);

    const positions3d = positions2d.map(points2d =>
      SimulationUtils.map2dTo3d({
        points: points2d,
        bottomLeft: new Vector3(0, bottomHeight, 1.25),
        rightDirection: new Vector3(1, 0, 0),
        upDirection: new Vector3(0, 1, 0)
      })
    );

    const ledMetadatas: SceneLedMetadata[] = [];
    positions3d.forEach((ribPositions, ribIndex) => {
      const rowNum = Math.floor((ribIndex % 8) / 2);
      ribPositions.forEach((p, ledIndex) => {
        ledMetadatas.push({
          position: p,
          hardwareChannel: ribIndex + 1,
          hardwareIndex: ledIndex,
          rowHint: rowNum
        });
      });
    });

    super({
      ...createVenue(),
      name,
      camera: {
        startPosition: new Vector3(0, 1.4, -2.5),
        target: new Vector3(0, 1.2, 0)
      },
      leds: ledMetadatas,
      ledRadius: 0.007,
      initialDisplayValues: {
        l: JSON.stringify(ribLengths)
      }
    });
  }
}
