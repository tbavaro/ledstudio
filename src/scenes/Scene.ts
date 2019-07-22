import * as Three from "three";

import PortableLedInfo from "../portable/base/LedInfo";

export interface LedInfo extends PortableLedInfo {
  position: Three.Vector3;
  hardwareChannel: number;
  hardwareIndex: number;
}

export interface Scene {
  readonly name: string;
  readonly leds: LedInfo[][];
  readonly ledRadius: number;
  readonly cameraStartPosition: Three.Vector3;
  readonly cameraTarget: Three.Vector3;
  readonly displayMessage: string;
  loadModel(): Promise<Three.Object3D>;
}

export default Scene;
