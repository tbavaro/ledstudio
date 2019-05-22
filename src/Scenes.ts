import * as Three from "three";
import { Vector2, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { promisify } from "util";

import { bracket, pushAll, roundPlaces } from "./portable/Utils";

import * as SimulationUtils from "./simulation/SimulationUtils";

import ColorRow from "./portable/base/ColorRow";
import  * as Colors from "./portable/base/Colors";
import FixedArray from "./portable/base/FixedArray";
import PianoVisualization from "./portable/base/PianoVisualization";

const FLOOR_SIZE_DEFAULT = 10;
const FLOOR_MATERIAL = new Three.MeshLambertMaterial({
  color: 0x090909
});


const UNMAPPED_LED_COLOR = Colors.hsv(300, 1, 0.25);

const INCH = 1 / 100 * 2.54;
const FOOT = INCH * 12;

const LedSpacings = {
  NEOPIXEL_30: (1 / 30),
  NEOPIXEL_60: (1 / 60)
};

// const EXTRA_OBJECT_MATERIAL_DEFAULT = () => {
//   return new Three.MeshBasicMaterial({
//     color: 0x004400,
//     transparent: true,
//     opacity: 0.7,
//     side: Three.DoubleSide
//   });
// };

const EXTRA_OBJECT_MATERIAL_DEFAULT = () => {
  return new Three.MeshLambertMaterial({
    color: 0x111111
  });
};

type ExtraObjectFunc = () => Three.Object3D;

interface ModelDef {
  url: string;
  scale?: Vector3;
  floorSizeOverride?: number;
}

interface CameraDef {
  target?: Vector3;
  startPosition?: Vector3;
}

interface LedsDef {
  calculatePositions: () => Vector3[][];
}

interface SceneDef {
  name: string;
  initialDisplayValues?: () => { [k: string]: string | number };
  camera?: CameraDef;
  model: ModelDef;
  extraObjects?: ExtraObjectFunc[];
  leds: LedsDef;
  createLedMapper?: (vis: PianoVisualization, targetLedNums: number[]) => LedMapper;
}

export abstract class LedMapper {
  protected readonly visColorRows: FixedArray<ColorRow>;
  protected readonly outputColorRows: FixedArray<ColorRow>;

  constructor(vis: PianoVisualization, targetLedNums: number[]) {
    this.visColorRows = vis.ledRows;
    this.outputColorRows = FixedArray.from(targetLedNums.map(n => new ColorRow(n)));
  }

  public abstract mapLeds(): FixedArray<ColorRow>;
}

type LedMapperAnchor = "beginning" | "middle";

class DefaultLedMapper extends LedMapper {
  private readonly visRowOffsets: number[];
  private readonly targetRowOffsets: number[];

  constructor(vis: PianoVisualization, targetLedNums: number[], anchor?: LedMapperAnchor) {
    super(vis, targetLedNums);

    if (anchor === undefined) {
      anchor = "beginning";
    }

    switch (anchor) {
      case "beginning":
        this.visRowOffsets = new Array(vis.ledRows.length).fill(0);
        this.targetRowOffsets = new Array(targetLedNums.length).fill(0);
        break;

      case "middle":
        this.visRowOffsets = vis.ledRows.map(r => Math.floor(r.length / 2));
        this.targetRowOffsets = targetLedNums.map(n => Math.floor(n / 2));
        break;

      default:
        throw new Error(`unsupported anchor type: '${anchor}'`);
    }

    console.log("offsets", this.visRowOffsets, this.targetRowOffsets);
  }

  public mapLeds() {
    let outputRowIdx = 0;
    while (outputRowIdx < this.outputColorRows.length) {
      const numRows = Math.min(this.outputColorRows.length - outputRowIdx, this.visColorRows.length);
      for (let visRowIdx = 0; visRowIdx < numRows; ++visRowIdx) {
        const visRow = this.visColorRows.get(visRowIdx);
        const visRowOffset = this.visRowOffsets[visRowIdx];
        const outputRowOffset = this.targetRowOffsets[outputRowIdx];
        const outputRow = this.outputColorRows.get(outputRowIdx++);

        const offset = outputRowOffset - visRowOffset;

        const minI = bracket(0, outputRow.length - 1, offset);
        const maxI = bracket(0, outputRow.length - 1, visRow.length - 1 + offset);

        outputRow.fill(UNMAPPED_LED_COLOR);
        for (let i = minI; i <= maxI; ++i) {
          outputRow.set(i, visRow.get(i - offset));
        }
        // for (let i = numLeds; i < outputRow.length; ++i) {
        //   outputRow.set(i, Colors.BLACK);
        // }
      }
    }
    return this.outputColorRows;
  }
}

// creates a box with the bottom centered at (0,0,0)
export function boxHelper(attrs: {
  width: number,
  height: number,
  depth: number,
  translateBy?: Vector3
}): ExtraObjectFunc {
  return () => {
    const geometry = new Three.BoxGeometry(attrs.width, attrs.height, attrs.depth);
    geometry.translate(0, attrs.height / 2, 0);
    if (attrs.translateBy) {
      geometry.translate(attrs.translateBy.x, attrs.translateBy.y, attrs.translateBy.z);
    }

    const material = EXTRA_OBJECT_MATERIAL_DEFAULT();
    const mesh = new Three.Mesh(geometry, material);
    return mesh;
  };
}

export class Scene {
  private readonly def: SceneDef;
  private lazyLoadedLedPositions?: Vector3[][];
  private lazyModelPromise?: Promise<Three.Object3D>;
  private displayValues: { [k: string]: string | number } | undefined;
  private cachedDisplayMessage: string | undefined;

  constructor(def: SceneDef) {
    this.def = def;
    this.lazyLoadedLedPositions = undefined;
  }

  public get name() {
    return this.def.name;
  }

  public get ledPositions(): Vector3[][] {
    if (this.lazyLoadedLedPositions === undefined) {
      this.lazyLoadedLedPositions = this.def.leds.calculatePositions();
      this.setDisplayValue("#leds", this.lazyLoadedLedPositions.reduce((accum, row) => accum + row.length, 0));
    }
    return this.lazyLoadedLedPositions;
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

  public createLedMapper(vis: PianoVisualization) {
    const targetLedNums = this.ledPositions.map(row => row.length);
    if (this.def.createLedMapper) {
      return this.def.createLedMapper(vis, targetLedNums);
    } else {
      return new DefaultLedMapper(vis, targetLedNums);
    }
  }
}

const registry = new Map<string, Scene>();
let defaultScene: Scene | undefined;

export function names(): ReadonlyArray<string> {
  return Array.from(registry.keys());
}

export function getScene(name: string): Scene {
  const result = registry.get(name);
  if (result === undefined) {
    throw new Error(`no scene with name: ${name}`);
  }
  return result;
}

function registerScenes(defs: ReadonlyArray<SceneDef>) {
  defs.forEach(def => {
    const scene = new Scene(def);
    const name = scene.name;
    if (registry.has(name)) {
      throw new Error(`scene already registered with name: ${name}`);
    }
    registry.set(name, scene);
  });
}

export function getDefaultScene(): Scene {
  if (defaultScene === undefined) {
    if (names.length === 0) {
      throw new Error("no scenes");
    }
    defaultScene = getScene(names[0]);
  }
  return defaultScene;
}

function makeLedSegments(segments: Array<{
  numLeds: number;
  startPoint: Three.Vector3;
  endPoint: Three.Vector3;
}>): LedsDef {
  return {
    calculatePositions: () => {
      return segments.map(segment => {
        const positions: Three.Vector3[] = [];
        const numLeds = segment.numLeds;
        const step = segment.endPoint.clone();
        step.sub(segment.startPoint);
        step.divideScalar(segment.numLeds - 1);
        for (let i = 0; i < numLeds; ++i) {
          const position = step.clone();
          position.multiplyScalar(i);
          position.add(segment.startPoint);
          positions.push(position);
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
    translateBy: new Vector3(-3.05 * FOOT, 0, 1.5)
  }));

  scene.add(banquetTable({
    translateBy: new Vector3(3.05 * FOOT, 0, 1.5)
  }));

  scene.add(banquetTable({
    riserHeight: 6 * INCH,
    translateBy: new Vector3(-3.05 * FOOT, 0, 2.2)
  }));

  scene.add(banquetTable({
    riserHeight: 6 * INCH,
    translateBy: new Vector3(3.05 * FOOT, 0, 2.2)
  }));

  scene.add(banquetTable({
    rotateY: Math.PI / 2,
    riserHeight: 6 * INCH,
    translateBy: new Vector3(7.45 * FOOT, 0, 2.75)
  }));

  scene.add(banquetTable({
    rotateY: Math.PI / 2,
    riserHeight: 3 * INCH,
    translateBy: new Vector3(-7.45 * FOOT, 0, 2.75)
  }));

  return scene;
}

const KEYBOARD_VENUE = {
  model: {
    url: "./keyboard.gltf",
    scale: new Vector3(0.1, 0.1, 0.12)
  },
  extraObjects: [
    // piano size
    // boxHelper({
    //   width: 1.336,
    //   height: 0.145,
    //   depth: 0.376,
    //   translateBy: new Vector3(0, 0.63, 0)
    // })
    () => djTables({ translateBy: new Vector3(0, 0, 1.5) })
  ]
};

function createWingsSceneDef(name: string, ledSpacing: number) {
  const calculate = doLazy(() => {
    const scale = 2.5;

    const middleCenter = new Vector2(0, 0.3).multiplyScalar(scale);
    const leftLegTop = new Vector2(-0.25, 0.3).multiplyScalar(scale);
    const leftLegBottom = new Vector2(-0.25, 0).multiplyScalar(scale);
    const leftWingTip = new Vector2(-0.65, 0.45).multiplyScalar(scale);

    const ribs = 6;

    const legPoints = SimulationUtils.pointsFromTo({
      start: leftLegTop,
      end: leftLegBottom,
      spacing: leftLegTop.clone().sub(leftLegBottom).length() / (ribs - 1)
    });

    let spanLengths: number[] = [];
    const leftSidePoints = legPoints.map((legPoint, row) => {
      const points: Vector2[] = [];
      spanLengths.push(middleCenter.clone().sub(legPoint).length());
      pushAll(points, SimulationUtils.pointsFromTo({
        start: legPoint,
        end: middleCenter,
        spacing: ledSpacing
      }));
      spanLengths.push(leftWingTip.clone().sub(legPoint).length());
      pushAll(points, SimulationUtils.pointsFromTo({
        start: legPoint,
        end: leftWingTip.clone().add(new Vector2(0, -0.01 * row)),
        spacing: ledSpacing,
        skipFirst: true
      }));
      return points;
    });

    // mirror left and right side and sort left-to-right
    const allPoints = leftSidePoints.map(row => {
      const points = [...row, ...row.map(p => new Vector2(-1 * p.x, p.y))];
      points.sort((a, b) => a.x - b.x);
      return points;
    });
    spanLengths = [...spanLengths, ...spanLengths];

    const maxSpanLength = spanLengths.reduce((a, b) => Math.max(a, b), 0);
    const totalSpanLength = spanLengths.reduce((a, b) => a + b, 0);
    // spanLengths.sort();
    // console.log("wing stats", `# leds: ${points.length}`, "spanLengths", spanLengths, `total span length: ${totalSpanLength}`);

    return {
      positions: allPoints.map(points => (
        SimulationUtils.map2dTo3d({
          points: points,
          bottomLeft: new Vector3(0, 0.3, 0.75),
          rightDirection: new Vector3(1, 0, 0),
          upDirection: new Vector3(0, 1, 0)
        })
      )),
      displayValues: {
        maxSpan: roundPlaces(maxSpanLength, 2),
        totalSpan: roundPlaces(totalSpanLength, 2)
      }
    };
  });

  return {
    ...KEYBOARD_VENUE,
    name,
    camera: {
      startPosition: new Vector3(0, 1.6, -2.2),
      target: new Vector3(0, 0.7, 0)
    },
    leds: { calculatePositions: () => calculate().positions },
    initialDisplayValues: () => calculate().displayValues,
    createLedMapper: (vis: PianoVisualization, targetLedNums: number[]) => new DefaultLedMapper(vis, targetLedNums, "middle")
  };
}

registerScenes([
  {
    ...KEYBOARD_VENUE,
    name: "keyboard:3stripes",
    camera: {
      startPosition: new Vector3(0, 1.1, -1.5),
      target: new Vector3(0, 0.5, 0)
    },
    leds: makeLedSegments([
      {
        numLeds: 88,
        startPoint: new Three.Vector3(-0.6, 0.74, -0.163),
        endPoint: new Three.Vector3(0.6, 0.74, -0.163)
      },
      {
        numLeds: 88,
        startPoint: new Three.Vector3(-0.6, 0.725, -0.168),
        endPoint: new Three.Vector3(0.6, 0.725, -0.168)
      },
      {
        numLeds: 88,
        startPoint: new Three.Vector3(-0.6, .71, -0.173),
        endPoint: new Three.Vector3(0.6, .71, -0.173)
      }
    ]),
    createLedMapper: (vis: PianoVisualization, numLeds: number[]) => new DefaultLedMapper(vis, numLeds)
  },
  createWingsSceneDef("keyboard:wings30", LedSpacings.NEOPIXEL_30),
  createWingsSceneDef("keyboard:wings60", LedSpacings.NEOPIXEL_60)
]);

defaultScene = getScene("keyboard:3stripes");
