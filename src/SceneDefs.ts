import * as Three from "three";

interface LedSegment {
  readonly numLeds: number;
  readonly startPoint: Three.Vector3;
  readonly endPoint: Three.Vector3;
}

export interface SceneDef {
  name: string;
  modelUrl: string;
  translateDownPercent?: number;
  ledSegment: LedSegment;  // TODO support multiple
}

const sceneDefs: SceneDef[] = [
  {
    name: "keyboard",
    modelUrl: "./keyboard.gltf",
    translateDownPercent: 0.2,
    ledSegment: {
      numLeds: 88,
      startPoint: new Three.Vector3(-6, 1.8, -1.38),
      endPoint: new Three.Vector3(6, 1.8, -1.38)
    }
  }
];

export default sceneDefs;
