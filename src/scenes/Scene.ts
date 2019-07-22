import * as Three from "three";

import PortableLedMetadata from "../portable/base/LedMetadata";

export interface LedMetadata extends PortableLedMetadata {
  position: Three.Vector3;
}

export interface Scene {
  readonly name: string;
  readonly ledMetadatas: LedMetadata[];
  readonly ledRadius: number;
  readonly cameraStartPosition: Three.Vector3;
  readonly cameraTarget: Three.Vector3;
  readonly displayMessage: string;
  loadModel(): Promise<Three.Object3D>;
}

export default Scene;
