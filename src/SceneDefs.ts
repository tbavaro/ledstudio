export interface SceneDef {
  name: string;
  modelUrl: string;
  translateDownPercent?: number;
}

export const sceneDefs: SceneDef[] = [
  {
    name: "keyboard",
    modelUrl: "./keyboard.gltf",
    translateDownPercent: 0.2
  }
];
