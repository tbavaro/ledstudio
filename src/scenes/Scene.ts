import * as Three from "three";

import ColorRow from "../portable/base/ColorRow";
import FixedArray from "../portable/base/FixedArray";
import PianoVisualization from "../portable/base/PianoVisualization";

export abstract class LedMapper {
  protected readonly visColorRows: FixedArray<ColorRow>;
  protected readonly outputColorRows: FixedArray<ColorRow>;

  constructor(vis: PianoVisualization, targetLedNums: number[]) {
    this.visColorRows = vis.ledRows;
    this.outputColorRows = FixedArray.from(targetLedNums.map(n => new ColorRow(n)));
  }

  public abstract mapLeds(): FixedArray<ColorRow>;
}

export interface Scene {
  readonly name: string;
  readonly ledPositions: Three.Vector3[][];
  readonly cameraStartPosition: Three.Vector3;
  readonly cameraTarget: Three.Vector3;
  readonly displayMessage: string;
  loadModel(): Promise<Three.Object3D>;
  createLedMapper(vis: PianoVisualization): LedMapper;
}

export default Scene;
