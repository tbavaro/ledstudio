import { Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

import * as Three from "three";

interface LedSegment {
  readonly numLeds: number;
  readonly startPoint: Three.Vector3;
  readonly endPoint: Three.Vector3;
}

export interface StageDef {
  name: string;
  modelUrl: string;
  translateDownPercent?: number;
  ledSegments: LedSegment[];
}

export default class Stage {
  private readonly def: StageDef;
  private lazyLoadedLedPositions?: Vector3[];

  constructor(def: StageDef) {
    this.def = def;
    this.lazyLoadedLedPositions = undefined;
  }

  public get name() {
    return this.def.name;
  }

  public get ledPositions(): Vector3[] {
    if (this.lazyLoadedLedPositions === undefined) {
      this.lazyLoadedLedPositions = this.loadLedPositions();
    }

    return this.lazyLoadedLedPositions.map(p => p.clone());
  }

  private loadLedPositions(): Vector3[] {
    return [];
  }

  public loadModel(onLoad: (model: Three.Scene) => void) {
    const loader = new GLTFLoader();
    loader.load(
      this.def.modelUrl,
      /*onLoad=*/(gltf) => {
        const boundingBox = new Three.Box3().setFromObject(gltf.scene);
        const center = boundingBox.getCenter(new Three.Vector3());
        gltf.scene.translateX(-center.x);
        gltf.scene.translateY(-center.y);
        gltf.scene.translateZ(-center.z);
        const size = boundingBox.getSize(new Three.Vector3());
        gltf.scene.translateY(-size.y * (this.def.translateDownPercent || 0));
        onLoad(gltf.scene);
      },
      /*onProgress=*/undefined,
      /*onError*/(error) => {
        alert(`gltf error: ${error}`);
      }
    );
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

export const registry = new StageRegistry();

registry.register([
  {
    name: "keyboard",
    modelUrl: "./keyboard.gltf",
    translateDownPercent: 0.2,
    ledSegments: [
      {
        numLeds: 88,
        startPoint: new Three.Vector3(-6, 1.95, -1.33),
        endPoint: new Three.Vector3(6, 1.95, -1.33)
      },
      {
        numLeds: 88,
        startPoint: new Three.Vector3(6, 1.8, -1.38),
        endPoint: new Three.Vector3(-6, 1.8, -1.38)
      },
      {
        numLeds: 88,
        startPoint: new Three.Vector3(-6, 1.65, -1.43),
        endPoint: new Three.Vector3(6, 1.65, -1.43)
      }
    ]
  }
]);
