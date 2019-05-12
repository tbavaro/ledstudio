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

const sceneDefs: StageDef[] = [
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
];

export default sceneDefs;
