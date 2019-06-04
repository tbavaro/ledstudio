import * as Three from "three";
import { Vector2, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { promisify } from "util";

import * as SimulationUtils from "../simulator/SimulationUtils";

import * as Scene from "./Scene";
import * as SceneUtils from "./SceneUtils";

const FLOOR_SIZE_DEFAULT = 10;
const FLOOR_MATERIAL = new Three.MeshLambertMaterial({
  color: 0x090909
});

const INCH = 1 / 100 * 2.54;
const FOOT = INCH * 12;

const LedSpacings = {
  NEOPIXEL_30: (1 / 30),
  NEOPIXEL_60: (1 / 60)
};

const EXTRA_OBJECT_MATERIAL_GREEN = () => {
  return new Three.MeshBasicMaterial({
    color: 0x000100,
    transparent: true,
    // opacity: 0.2,
    side: Three.DoubleSide
  });
};

const EXTRA_OBJECT_MATERIAL_DEFAULT = () => {
  return new Three.MeshLambertMaterial({
    color: 0x111111
  });
};

type ExtraObjectFunc = () => Three.Object3D;

interface ModelDef {
  url: string;
  scale?: Vector3;
  translateBy?: Vector3;
  floorSizeOverride?: number;
}

interface CameraDef {
  target?: Vector3;
  startPosition?: Vector3;
}

interface LedsDef {
  calculate: () => Scene.LedInfo[][];
}

interface SceneDef {
  name: string;
  initialDisplayValues?: () => { [k: string]: string | number };
  camera?: CameraDef;
  model: ModelDef;
  extraObjects?: ExtraObjectFunc[];
  leds: LedsDef;
}

// creates a box with the bottom centered at (0,0,0)
export function boxHelper(attrs: {
  width: number,
  height: number,
  depth: number,
  translateBy?: Vector3,
  material?: Three.Material,
}): ExtraObjectFunc {
  return () => {
    const geometry = new Three.BoxGeometry(attrs.width, attrs.height, attrs.depth);
    geometry.translate(0, attrs.height / 2, 0);
    if (attrs.translateBy) {
      geometry.translate(attrs.translateBy.x, attrs.translateBy.y, attrs.translateBy.z);
    }

    const material = attrs.material || EXTRA_OBJECT_MATERIAL_DEFAULT();
    const mesh = new Three.Mesh(geometry, material);
    return mesh;
  };
}

export class SceneImpl implements Scene.default {
  private readonly def: SceneDef;
  private lazyLoadedLeds?: Scene.LedInfo[][];
  private lazyModelPromise?: Promise<Three.Object3D>;
  private displayValues: { [k: string]: string | number } | undefined;
  private cachedDisplayMessage: string | undefined;

  constructor(def: SceneDef) {
    this.def = def;
    this.lazyLoadedLeds = undefined;
  }

  public get name() {
    return this.def.name;
  }

  public get leds(): Scene.LedInfo[][] {
    if (this.lazyLoadedLeds === undefined) {
      this.lazyLoadedLeds = this.def.leds.calculate();
      this.setDisplayValue("#leds", this.lazyLoadedLeds.reduce((accum, row) => accum + row.length, 0));
    }
    return this.lazyLoadedLeds;
  }

  public async loadModel(): Promise<Three.Object3D> {
    if (this.lazyModelPromise === undefined) {
      this.lazyModelPromise = promisify<Three.Object3D>(callback => {
        const loader = new GLTFLoader();
        loader.load(
          this.def.model.url,
          /*onLoad=*/(gltf) => {
            let model = gltf.scene;
            if (this.def.model.scale !== undefined) {
              model = model.clone();
              model.scale.copy(this.def.model.scale);
            }

            const boundingBox = new Three.Box3().setFromObject(model);
            const center = boundingBox.getCenter(new Three.Vector3());
            const bottomY = boundingBox.min.y;
            model.translateX(-center.x);
            model.translateY(-bottomY);
            model.translateZ(-center.z);
            if (this.def.model.translateBy) {
              model.position.add(this.def.model.translateBy);
            }
            callback(null, this.addExtraObjects(model));
          },
          /*onProgress=*/undefined,
          /*onError*/(error) => {
            callback(new Error(`gltf error: ${error}`), null as any);
          }
        );
      })();
    }
    return this.lazyModelPromise;
  }

  private addExtraObjects(model: Three.Object3D): Three.Scene {
    const scene = new Three.Scene();

    scene.add(model);

    // floor
    if (this.def.model.floorSizeOverride !== 0) {
      const floorSize = this.def.model.floorSizeOverride || FLOOR_SIZE_DEFAULT;
      const floorGeometry = new Three.PlaneGeometry(floorSize, floorSize).rotateX(-1 * Math.PI / 2);
      const floor = new Three.Mesh(floorGeometry, FLOOR_MATERIAL);

      // lower it ever-so-slightly to avoid collision with any semi-transparent things on the floor
      floor.translateY(-0.001);

      scene.add(floor);
    }

    // add extra objects
    (this.def.extraObjects || []).forEach(func => scene.add(func()));

    return scene;
  }

  public get cameraTarget(): Vector3 {
    if (this.def.camera !== undefined && this.def.camera.target !== undefined) {
      return this.def.camera.target;
    } else {
      return new Vector3(0, 0, 0);
    }
  }

  public get cameraStartPosition(): Vector3 {
    if (this.def.camera !== undefined && this.def.camera.startPosition !== undefined) {
      return this.def.camera.startPosition.clone();
    } else {
      return new Vector3(0, 0, -10);
    }
  }

  private initDisplayValuesIfNeeded(): { [k: string]: string | number } {
    if (this.displayValues === undefined) {
      if (this.def.initialDisplayValues) {
        this.displayValues = this.def.initialDisplayValues();
      } else {
        this.displayValues = {};
      }
    }
    return this.displayValues;
  }

  private setDisplayValue(key: string, value: string | number) {
    this.initDisplayValuesIfNeeded()[key] = value;
  }

  public get displayMessage(): string {
    if (this.cachedDisplayMessage === undefined) {
      this.cachedDisplayMessage = Object.entries(this.initDisplayValuesIfNeeded()).map((entry) => `${entry[0]}=${entry[1]}`).join(" / ");
    }
    return this.cachedDisplayMessage;
  }
}

const registry = new Map<string, Scene.default>();

export function names(): ReadonlyArray<string> {
  return Array.from(registry.keys());
}

export function getScene(name: string): Scene.default {
  const result = registry.get(name);
  if (result === undefined) {
    throw new Error(`no scene with name: ${name}`);
  }
  return result;
}

function registerScenes(defs: ReadonlyArray<SceneDef>) {
  defs.forEach(def => {
    const scene = new SceneImpl(def);
    const name = scene.name;
    if (registry.has(name)) {
      throw new Error(`scene already registered with name: ${name}`);
    }
    registry.set(name, scene);
  });
}

export function isValidName(name: string) {
  return names().includes(name);
}

function makeLedSegments(segments: Array<{
  numLeds: number;
  startPoint: Three.Vector3;
  endPoint: Three.Vector3;
  hardwareChannel: number;
}>): LedsDef {
  return {
    calculate: () => {
      return segments.map(segment => {
        const positions: Scene.LedInfo[] = [];
        const numLeds = segment.numLeds;
        const step = segment.endPoint.clone();
        step.sub(segment.startPoint);
        step.divideScalar(segment.numLeds - 1);
        for (let i = 0; i < numLeds; ++i) {
          const position = step.clone();
          position.multiplyScalar(i);
          position.add(segment.startPoint);
          const led: Scene.LedInfo = {
            position: position,
            hardwareChannel: segment.hardwareChannel,
            hardwareIndex: i
          };
          positions.push(led);
        }
        return positions;
      });
    }
  };
}

function doLazy<T>(func: () => T): () => T {
  let ran = false;
  let result: any;

  return () => {
    if (!ran) {
      result = func();
      ran = true;
    }
    return result;
  };
}

// table (https://www.target.com/p/6-folding-banquet-table-off-white-plastic-dev-group/-/A-14324329)
function banquetTable(attrs: {
  translateBy: Vector3,
  riserHeight?: number,
  rotateY?: number
}) {
  const tableWidth = 6 * FOOT;
  const tableDepth = 30 * INCH;
  const tableThickness = 2 * INCH;
  const legHeight = 27.25 * INCH;
  const legInset = 6 * INCH;

  const object = new Three.Object3D();
  object.add(boxHelper({
    width: tableWidth,
    height: tableThickness,
    depth: tableDepth,
    translateBy: new Vector3(0, legHeight, 0)
  })());

  const { riserHeight } = attrs;

  const leg = boxHelper({
    width: 1 * INCH,
    height: legHeight,
    depth: 1 * INCH
  })();
  [[-1, -1], [-1, 1], [1, 1], [1, -1]].forEach(([x, z]) => {
    const thisLeg = leg.clone();
    const legX = x * (tableWidth * 0.5 - legInset);
    const legZ = z * (tableDepth * 0.5 - legInset);
    thisLeg.position.copy(
      new Vector3(
        legX,
        0,
        legZ
      )
    );
    object.add(thisLeg);

    if (riserHeight) {
      const riser = boxHelper({
        width: 6 * INCH,
        depth: 6 * INCH,
        height: riserHeight,
        translateBy: new Vector3(legX, -1 * riserHeight, legZ)
      })();
      object.add(riser);
    }
  });

  if (attrs.rotateY) {
    object.rotateY(attrs.rotateY);
  }

  if (riserHeight) {
    object.children.forEach(c => c.translateY(riserHeight));
  }

  object.position.add(attrs.translateBy);

  return object;
}

// center is middle of front row of tables
function djTables(attrs: {
  translateBy: Vector3
}) {
  const scene = new Three.Object3D();

  scene.add(banquetTable({
    translateBy: new Vector3(-3.05 * FOOT, 0, 0)
  }));

  scene.add(banquetTable({
    translateBy: new Vector3(3.05 * FOOT, 0, 0)
  }));

  scene.add(banquetTable({
    riserHeight: 6 * INCH,
    translateBy: new Vector3(-3.05 * FOOT, 0, 0.7)
  }));

  scene.add(banquetTable({
    riserHeight: 6 * INCH,
    translateBy: new Vector3(3.05 * FOOT, 0, 0.7)
  }));

  scene.add(banquetTable({
    rotateY: Math.PI / 2,
    riserHeight: 6 * INCH,
    translateBy: new Vector3(7.45 * FOOT, 0, 1.25)
  }));

  scene.add(banquetTable({
    rotateY: Math.PI / 2,
    riserHeight: 3 * INCH,
    translateBy: new Vector3(-7.45 * FOOT, 0, 1.25)
  }));

  scene.position.add(attrs.translateBy);

  return scene;
}

function createKeyboardVenue(attrs: {
  keyboardInFront: boolean
}) {
  const tablesTranslateZ = (attrs.keyboardInFront ? 1.5 : -1);
  const keyboardTranslateZ = tablesTranslateZ + (attrs.keyboardInFront ? -1.5 : 1.35);
  const shoulderHeight = 57 * INCH;

  return {
    model: {
      url: "./keyboard.gltf",
      scale: new Vector3(0.1, 0.1, 0.12),
      translateBy: new Vector3(0, 0, keyboardTranslateZ)
    },
    extraObjects: [
      // piano size
      // boxHelper({
      //   width: 1.336,
      //   height: 0.145,
      //   depth: 0.376,
      //   translateBy: new Vector3(0, 0.63, 0)
      // })
      () => djTables({ translateBy: new Vector3(0, 0, tablesTranslateZ) }),
      boxHelper({
        width: 20 * INCH,
        height: shoulderHeight,
        depth: 10 * INCH,
        translateBy: new Vector3(0, 0, keyboardTranslateZ + 0.5),
        material: EXTRA_OBJECT_MATERIAL_GREEN()
      }),
      boxHelper({
        width: 10 * INCH,
        height: 12 * INCH,
        depth: 10 * INCH,
        translateBy: new Vector3(0, shoulderHeight + 1 * INCH, keyboardTranslateZ + 0.5),
        material: EXTRA_OBJECT_MATERIAL_GREEN()
      })
    ]
  };
}

function createWingsSceneDef(name: string, ledSpacing: number, ribs: number) {
  const extraLength = 1 * INCH;
  const skipFirst = 0.75 * INCH;

  const innerTopLength = 30 * INCH + extraLength;
  const innerBottomLength = 36 * INCH + extraLength;
  const spineLength = 24 * INCH;
  const outerTopLength = 60 * INCH + extraLength;
  const outerBottomLength = 72 * INCH;
  const shortenEachSubsequentOuterRibBy = 2 * INCH;

  const centerPointHeight = 57 * INCH; // colombi's shoulders

  const innerTriangle = SceneUtils.triangleFromLengths({
    verticalLength: spineLength,
    topSideLength: innerTopLength,
    bottomSideLength: innerBottomLength
  });
  const innerTriangleWidth = SceneUtils.width2D(innerTriangle);

  const calculate = doLazy(() => {
    const triangleTranslation = new Vector2(-1 * innerTriangleWidth, 0);
    innerTriangle.forEach(p => p.add(triangleTranslation));

    const outerTriangle = SceneUtils.triangleFromLengths({
      verticalLength: spineLength,
      topSideLength: outerTopLength,
      bottomSideLength: outerBottomLength,
      flipX: true
    });
    outerTriangle.forEach(p => p.add(triangleTranslation));

    const middleCenter = innerTriangle[2];
    const leftLegTop = innerTriangle[1];
    const leftLegBottom = innerTriangle[0];
    const leftWingTip = outerTriangle[2];

    const legPoints = SimulationUtils.pointsFromTo({
      start: leftLegTop,
      end: leftLegBottom,
      spacing: leftLegTop.clone().sub(leftLegBottom).length() / (ribs - 1)
    });

    const ribCounts: any[] = [];

    const makeChannelLeds = (channel: number, points2d: Vector2[]): Scene.LedInfo[] => {
      const points3d = SimulationUtils.map2dTo3d({
        points: points2d,
        bottomLeft: new Vector3(0, centerPointHeight - innerTriangle[2].y, 1.25),
        rightDirection: new Vector3(1, 0, 0),
        upDirection: new Vector3(0, 1, 0)
      });
      return points3d.map((p, idx) => ({ position: p, hardwareChannel: channel, hardwareIndex: idx }));
    };

    const firstChannel = 1;
    let nextChannel = firstChannel;

    const leftSideLeds = legPoints.map((legPoint, row) => {
      const innerLeds = makeChannelLeds(nextChannel++, SimulationUtils.pointsFromTo({
        start: legPoint,
        end: middleCenter,
        spacing: ledSpacing,
        skipFirst: skipFirst,
        shortenBy: 0.75 * INCH
      }));

      const outerLeds = makeChannelLeds(nextChannel++, SimulationUtils.pointsFromTo({
        start: legPoint,
        end: leftWingTip, // .clone().add(new Vector2(0, -0.01 * row)),
        spacing: ledSpacing,
        skipFirst: skipFirst,
        shortenBy: row * shortenEachSubsequentOuterRibBy
      }));

      ribCounts.push({
        i: innerLeds.length,
        o: outerLeds.length
      });

      return [...innerLeds, ...outerLeds];
    });

    const rightSideChannelOffset = nextChannel - firstChannel;

    // mirror left and right side and sort left-to-right
    const allLeds = leftSideLeds.map(row => {
      const leds = [...row, ...row.map(led => ({
        position: new Vector3(-1 * led.position.x, led.position.y, led.position.z),
        hardwareChannel: led.hardwareChannel + rightSideChannelOffset,
        hardwareIndex: led.hardwareIndex
      }))];
      leds.sort((a, b) => a.position.x - b.position.x);
      return leds;
    });

    return {
      leds: allLeds,
      displayValues: {
        ribCounts: JSON.stringify(ribCounts)
      }
    };
  });

  const kbVenue = createKeyboardVenue({ keyboardInFront: false });
  kbVenue.extraObjects.push(boxHelper({
    width: 4 * INCH,
    height: 65 * INCH,
    depth: 4 * INCH,
    translateBy: new Vector3(innerTriangleWidth, 0, 1.32 ),
  }));
  kbVenue.extraObjects.push(boxHelper({
    width: 4 * INCH,
    height: 65 * INCH,
    depth: 4 * INCH,
    translateBy: new Vector3(-1 * innerTriangleWidth, 0, 1.32),
  }));

  const sceneDef: SceneDef = {
    ...kbVenue,
    name,
    camera: {
      startPosition: new Vector3(0, 1.4, -2.5),
      target: new Vector3(0, 1.2, 0)
    },
    leds: { calculate: () => calculate().leds },
    initialDisplayValues: () => calculate().displayValues
  };

  return sceneDef;
}

registerScenes([
  {
    ...createKeyboardVenue({ keyboardInFront: true }),
    name: "keyboard:3stripes",
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
        startPoint: new Three.Vector3(-0.6, .71, -0.173),
        endPoint: new Three.Vector3(0.6, .71, -0.173),
        hardwareChannel: 3
      }
    ])
  },
  createWingsSceneDef("burrow:wings30x2", LedSpacings.NEOPIXEL_30, 2),
  createWingsSceneDef("burrow:wings30x3", LedSpacings.NEOPIXEL_30, 3),
  createWingsSceneDef("burrow:wings30x4", LedSpacings.NEOPIXEL_30, 4),
  createWingsSceneDef("burrow:wings30x5", LedSpacings.NEOPIXEL_30, 5),
  createWingsSceneDef("burrow:wings30x7", LedSpacings.NEOPIXEL_30, 7),
  createWingsSceneDef("burrow:wings60x7", LedSpacings.NEOPIXEL_60, 7)
]);

export const defaultSceneName = "burrow:wings30x2";
if (!isValidName(defaultSceneName)) {
  throw new Error("not a valid scene name");
}
