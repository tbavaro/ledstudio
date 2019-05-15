import * as Three from "three";
import { Vector2, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { promisify } from "util";

import { pushAll } from "./portable/Utils";

import * as SimulationUtils from "./simulation/SimulationUtils";

const FLOOR_SIZE_DEFAULT = 10;
const FLOOR_COLOR = 0x070707;

const LedSpacings = {
  NEOPIXEL_30: (1 / 30),
  NEOPIXEL_60: (1 / 60)
};

const EXTRA_OBJECT_MATERIAL_DEFAULT = () => {
  return new Three.MeshBasicMaterial({
    color: 0x004400,
    transparent: true,
    opacity: 0.7,
    side: Three.DoubleSide
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
  calculatePositions: () => Vector3[];
}

interface SceneDef {
  name: string;
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
  translateBy?: Vector3
}): ExtraObjectFunc {
  return () => {
    const geometry = new Three.BoxGeometry(attrs.width, attrs.height, attrs.depth);
    geometry.translate(0, attrs.height / 2, 0);
    if (attrs.translateBy) {
      geometry.translate(attrs.translateBy.x, attrs.translateBy.y, attrs.translateBy.z);
    }

    const material = EXTRA_OBJECT_MATERIAL_DEFAULT();
    return new Three.Mesh(geometry, material);
  };
}

export class Scene {
  private readonly def: SceneDef;
  private lazyLoadedLedPositions?: Vector3[];
  private lazyModelPromise?: Promise<Three.Object3D>;

  constructor(def: SceneDef) {
    this.def = def;
    this.lazyLoadedLedPositions = undefined;
  }

  public get name() {
    return this.def.name;
  }

  public get ledPositions(): Vector3[] {
    if (this.lazyLoadedLedPositions === undefined) {
      this.lazyLoadedLedPositions = this.def.leds.calculatePositions();
    }
    return this.lazyLoadedLedPositions.map(p => p.clone());
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
      const floorMaterial = new Three.MeshBasicMaterial({
        color: FLOOR_COLOR
      });
      const floor = new Three.Mesh(floorGeometry, floorMaterial);

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
      const positions: Three.Vector3[] = [];
      segments.forEach(segment => {
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
      });
      return positions;
    }
  };
}

export function calculateWingsPositions(ledSpacing: number) {
  const scale = 2.5;

  const middleCenter = new Vector2(0, 0.3).multiplyScalar(scale);
  const leftLegTop = new Vector2(-0.25, 0).multiplyScalar(scale);
  const leftLegBottom = new Vector2(-0.25, 0.3).multiplyScalar(scale);
  const leftWingTip = new Vector2(-0.65, 0.45).multiplyScalar(scale);

  const ribs = 6;

  const legPoints = SimulationUtils.pointsFromTo({
    start: leftLegTop,
    end: leftLegBottom,
    spacing: leftLegTop.clone().sub(leftLegBottom).length() / (ribs - 1)
  });

  const leftSidePoints: Vector2[] = [];
  let spanLengths: number[] = [];
  legPoints.forEach(legPoint => {
    spanLengths.push(middleCenter.clone().sub(legPoint).length());
    pushAll(leftSidePoints, SimulationUtils.pointsFromTo({
      start: middleCenter,
      end: legPoint,
      spacing: ledSpacing,
      skipFirst: true
    }));
    spanLengths.push(leftWingTip.clone().sub(legPoint).length());
    pushAll(leftSidePoints, SimulationUtils.pointsFromTo({
      start: legPoint,
      end: leftWingTip,
      spacing: ledSpacing,
      skipFirst: true
    }));
  });

  // mirror left and right side
  const rightSidePoints = leftSidePoints.map(p => new Vector2(-1 * p.x, p.y));
  const points = [...leftSidePoints, ...rightSidePoints];
  spanLengths = [...spanLengths, ...spanLengths];

  spanLengths.sort();
  const totalSpanLength = spanLengths.reduce((a, b) => a + b, 0);
  console.log("wing stats", `# leds: ${points.length}`, "spanLengths", spanLengths, `total span length: ${totalSpanLength}`);

  return SimulationUtils.map2dTo3d({
    points: points,
    bottomLeft: new Vector3(0, 0.3, 0.75),
    rightDirection: new Vector3(1, 0, 0),
    upDirection: new Vector3(0, 1, 0)
  });
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
  ]
};

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
        startPoint: new Three.Vector3(0.6, 0.725, -0.168),
        endPoint: new Three.Vector3(-0.6, 0.725, -0.168)
      },
      {
        numLeds: 88,
        startPoint: new Three.Vector3(-0.6, .71, -0.173),
        endPoint: new Three.Vector3(0.6, .71, -0.173)
      }
    ])
  },
  {
    ...KEYBOARD_VENUE,
    name: "keyboard:wings30",
    camera: {
      startPosition: new Vector3(0, 1.6, -2.2),
      target: new Vector3(0, 0.7, 0)
    },
    leds: { calculatePositions: () => calculateWingsPositions(LedSpacings.NEOPIXEL_30) }
  },
  {
    ...KEYBOARD_VENUE,
    name: "keyboard:wings60",
    camera: {
      startPosition: new Vector3(0, 1.6, -2.2),
      target: new Vector3(0, 0.7, 0)
    },
    leds: { calculatePositions: () => calculateWingsPositions(LedSpacings.NEOPIXEL_60) }
  }
]);

defaultScene = getScene("keyboard:wings30");
