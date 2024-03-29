import { promisify } from "util";

import * as Three from "three";
import { Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

import PortableLedMetadata from "../portable/base/LedMetadata";

export interface SceneLedMetadata extends PortableLedMetadata {
  position: Three.Vector3;
}

const FLOOR_SIZE_DEFAULT = 10;
const FLOOR_MATERIAL = new Three.MeshLambertMaterial({
  color: 0x090909
});

export type ExtraObjectFunc = () => Three.Object3D;

export interface ModelDef {
  url: string;
  scale?: Vector3;
  translateBy?: Vector3;
}

export interface CameraDef {
  target?: Vector3;
  startPosition?: Vector3;
}

export interface SceneDef {
  name: string;
  initialDisplayValues?: { [k: string]: string | number };
  camera?: CameraDef;
  model?: ModelDef;
  floorSizeOverride?: number;
  extraObjects?: ExtraObjectFunc[];
  leds: SceneLedMetadata[];
  ledRadius: number;
  voronoiMaxDimension: number;
}

export default class Scene {
  private readonly def: SceneDef;
  private lazyModelPromise?: Promise<Three.Object3D>;
  private displayValues: { [k: string]: string | number } | undefined;
  private cachedDisplayMessage: string | undefined;

  public readonly ledRadius: number;
  public readonly ledMetadatas: SceneLedMetadata[];

  constructor(def: SceneDef) {
    this.def = def;
    this.ledMetadatas = this.def.leds;
    this.setDisplayValue("#leds", this.def.leds.length);
    this.ledRadius = def.ledRadius;
  }

  public get name() {
    return this.def.name;
  }

  public toString() {
    return `<scene:${this.name}>`;
  }

  public async loadModel(): Promise<Three.Object3D> {
    if (this.lazyModelPromise === undefined) {
      this.lazyModelPromise = promisify<Three.Object3D>(callback => {
        const modelDef = this.def.model;
        if (modelDef === undefined) {
          callback(null, new Three.Object3D());
          return;
        }

        const loader = new GLTFLoader();
        loader.load(
          modelDef.url,
          /*onLoad=*/ gltf => {
            let model = gltf.scene;
            if (modelDef.scale !== undefined) {
              model = model.clone();
              model.scale.copy(modelDef.scale);
            }

            const boundingBox = new Three.Box3().setFromObject(model);
            const center = boundingBox.getCenter(new Three.Vector3());
            const bottomY = boundingBox.min.y;
            model.translateX(-center.x);
            model.translateY(-bottomY);
            model.translateZ(-center.z);
            if (modelDef.translateBy) {
              model.position.add(modelDef.translateBy);
            }
            callback(null, model);
          },
          /*onProgress=*/ undefined,
          /*onError*/ error => {
            callback(new Error(`gltf error: ${error}`), null as any);
          }
        );
      })().then(scene => {
        return this.addExtraObjects(scene);
      });
    }
    return this.lazyModelPromise;
  }

  private addExtraObjects(model: Three.Object3D): Three.Scene {
    const scene = new Three.Scene();

    scene.add(model);

    // floor
    if (this.def.floorSizeOverride !== 0) {
      const floorSize = this.def.floorSizeOverride || FLOOR_SIZE_DEFAULT;
      const floorGeometry = new Three.PlaneGeometry(
        floorSize,
        floorSize
      ).rotateX((-1 * Math.PI) / 2);
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
    if (
      this.def.camera !== undefined &&
      this.def.camera.startPosition !== undefined
    ) {
      return this.def.camera.startPosition.clone();
    } else {
      return new Vector3(0, 0, -10);
    }
  }

  private initDisplayValuesIfNeeded(): { [k: string]: string | number } {
    if (this.displayValues === undefined) {
      if (this.def.initialDisplayValues) {
        this.displayValues = this.def.initialDisplayValues;
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
      this.cachedDisplayMessage = Object.entries(
        this.initDisplayValuesIfNeeded()
      )
        .map(entry => `${entry[0]}=${entry[1]}`)
        .join(" / ");
    }
    return this.cachedDisplayMessage;
  }

  public get voronoiMaxDimension() {
    return this.def.voronoiMaxDimension;
  }
}
