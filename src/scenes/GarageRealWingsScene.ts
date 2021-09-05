import { FOOT, INCH } from "src/util/Units";
import { first, interleave, last } from "src/util/Utils";
import { DoubleSide, MeshBasicMaterial, Vector2, Vector3 } from "three";

import * as SimulationUtils from "../simulator/SimulationUtils";
import { createTrianglePositions2d } from "./BurrowRealWingsScene";
import Scene, { SceneLedMetadata } from "./Scene";
import { boxHelper } from "./SceneUtils";

// measurements
const smallBottomHeight = 59 * INCH;
const smallSeparation = 2.25 * INCH;
const largeBottomHeight = 41.5 * INCH;
const largeSeparation = 4.25 * INCH;

const WALL_MATERIAL = () => {
  return new MeshBasicMaterial({
    color: 0x070707,
    transparent: true,
    // opacity: 0.2,
    side: DoubleSide
  });
};

function createVenue() {
  return {
    extraObjects: [
      () =>
        boxHelper({
          width: 10 * FOOT,
          height: 9 * FOOT,
          depth: 6 * INCH,
          translateBy: new Vector3(0, 0, 4.5 * FOOT),
          material: WALL_MATERIAL()
        })()
    ]
  };
}

function moveToPositionAndRotate(
  leds: Vector2[][],
  ribIndex: number,
  useLastLed: boolean,
  position: Vector2,
  angleDegrees: number
) {
  const origin = new Vector2(0, 0);
  const ledToMoveToOrigin = (useLastLed ? last : first)(leds[ribIndex]);
  return leds.map(innerLeds =>
    innerLeds.map(p =>
      p
        .clone()
        .sub(ledToMoveToOrigin)
        .rotateAround(origin, (angleDegrees / 180) * Math.PI)
        .add(position)
    )
  );
}

function calculateLedPositions2d() {
  console.log("small", createTrianglePositions2d("small"));

  const smallLeftRibs = moveToPositionAndRotate(
    createTrianglePositions2d("small"),
    0,
    /*useLastLed=*/ true,
    new Vector2(smallSeparation / 2, smallBottomHeight),
    -124.2
  );

  const largeLeftRibs = moveToPositionAndRotate(
    createTrianglePositions2d("large"),
    3,
    /*useLastLed=*/ false,
    new Vector2(largeSeparation / 2, largeBottomHeight),
    -90
  );

  const allLeftRibs = interleave(smallLeftRibs, largeLeftRibs);

  const flipX = (v: Vector2) => new Vector2(-1 * v.x, v.y);
  const allRightRibs = allLeftRibs.map(rib => rib.map(flipX));

  return [...allLeftRibs, ...allRightRibs];
}

export default class GarageRealWingsScene extends Scene {
  public constructor(name: string) {
    const positions2d = calculateLedPositions2d();
    const ribLengths = positions2d.map(r => r.length);

    const positions3d = positions2d.map(points2d =>
      SimulationUtils.map2dTo3d({
        points: points2d,
        bottomLeft: new Vector3(0, 0, 1.25),
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
