import * as Three from "three";
import { Vector2, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { promisify } from "util";

import { pushAll } from "../portable/Utils";

import * as SimulationUtils from "./SimulationUtils";

interface ModelDef {
  url: string;
}

interface CameraDef {
  target?: Vector3;
  startPosition?: Vector3;
}

interface LedsDef {
  calculatePositions: () => Vector3[];
}

interface StageDef {
  name: string;
  camera?: CameraDef;
  model: ModelDef;
  leds: LedsDef;
}

export default class Stage {
  private readonly def: StageDef;
  private lazyLoadedLedPositions?: Vector3[];
  private lazyModelPromise?: Promise<Three.Scene>;

  constructor(def: StageDef) {
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

  public async loadModel(): Promise<Three.Scene> {
    if (this.lazyModelPromise === undefined) {
      this.lazyModelPromise = promisify<Three.Scene>(callback => {
        const loader = new GLTFLoader();
        loader.load(
          this.def.model.url,
          /*onLoad=*/(gltf) => {
            const boundingBox = new Three.Box3().setFromObject(gltf.scene);
            const center = boundingBox.getCenter(new Three.Vector3());
            const bottomY = boundingBox.min.y;
            gltf.scene.translateX(-center.x);
            gltf.scene.translateY(-bottomY);
            gltf.scene.translateZ(-center.z);
            callback(null, gltf.scene);
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

export class StageRegistry {
  private readonly map = new Map<string, Stage>();

  public get stageNames(): ReadonlyArray<string> {
    return Array.from(this.map.keys());
  }

  public getStage(name: string): Stage {
    const result = this.map.get(name);
    if (result === undefined) {
      throw new Error(`no stage with name: ${name}`);
    }
    return result;
  }

  public register(stageDefs: ReadonlyArray<StageDef>) {
    stageDefs.forEach(stageDef => {
      const stage = new Stage(stageDef);
      const name = stage.name;
      if (this.map.has(name)) {
        throw new Error(`stage already registered with name: ${name}`);
      }
      this.map.set(name, stage);
    });
  }

  public defaultStage(): Stage {
    const stageNames = this.stageNames;
    if (stageNames.length === 0) {
      throw new Error("no stages");
    }
    return this.getStage(stageNames[0]);
  }
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

export function calculateWingsPositions() {
  const middleCenter = new Vector2(0, 3);
  const leftLegTop = new Vector2(-2.5, 0);
  const leftLegBottom = new Vector2(-2.5, 3);
  const leftWingTip = new Vector2(-6.5, 4.5);

  const LED_SPACING = 0.2;

  const ribs = 6;

  const legPoints = SimulationUtils.pointsFromTo({
    start: leftLegTop,
    end: leftLegBottom,
    spacing: leftLegTop.clone().sub(leftLegBottom).length() / (ribs - 1)
  });

  const leftSidePoints: Vector2[] = [];
  legPoints.forEach(legPoint => {
    pushAll(leftSidePoints, SimulationUtils.pointsFromTo({
      start: middleCenter,
      end: legPoint,
      spacing: LED_SPACING,
      skipFirst: true
    }));
    pushAll(leftSidePoints, SimulationUtils.pointsFromTo({
      start: legPoint,
      end: leftWingTip,
      spacing: LED_SPACING,
      skipFirst: true
    }));
  });

  const rightSidePoints = leftSidePoints.map(p => new Vector2(-1 * p.x, p.y));

  const points = [...leftSidePoints, ...rightSidePoints];

  return SimulationUtils.map2dTo3d({
    points: points,
    bottomLeft: new Vector3(0, 3, 4.5),
    rightDirection: new Vector3(1, 0, 0),
    upDirection: new Vector3(0, 1, 0),
    scale: 2.5
  });
}

export const registry = new StageRegistry();

const KEYBOARD_VENUE = {
  model: {
    url: "./keyboard.gltf"
  },
  camera: {
    startPosition: new Vector3(0, 12, -14),
    target: new Vector3(0, 5, 0)
  }
};

registry.register([
  {
    ...KEYBOARD_VENUE,
    name: "keyboard:3stripes",
    leds: makeLedSegments([
      {
        numLeds: 88,
        startPoint: new Three.Vector3(-6, 7.40, -1.33),
        endPoint: new Three.Vector3(6, 7.40, -1.33)
      },
      {
        numLeds: 88,
        startPoint: new Three.Vector3(6, 7.25, -1.38),
        endPoint: new Three.Vector3(-6, 7.25, -1.38)
      },
      {
        numLeds: 88,
        startPoint: new Three.Vector3(-6, 7.10, -1.43),
        endPoint: new Three.Vector3(6, 7.10, -1.43)
      }
    ])
  },
  {
    ...KEYBOARD_VENUE,
    name: "keyboard:wings",
    leds: { calculatePositions: calculateWingsPositions }
  }
]);
