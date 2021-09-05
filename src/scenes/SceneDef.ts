import * as Three from "three";
import { Vector3 } from "three";

import * as Scene from "./Scene";

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

export interface LedsDef {
  calculate: () => Scene.LedMetadata[];
}

export default interface SceneDef {
  name: string;
  initialDisplayValues?: () => { [k: string]: string | number };
  camera?: CameraDef;
  model?: ModelDef;
  floorSizeOverride?: number;
  extraObjects?: ExtraObjectFunc[];
  leds: LedsDef;
  ledRadius: number;
}
