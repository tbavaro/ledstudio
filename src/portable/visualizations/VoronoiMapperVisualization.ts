import { Vector2, Vector3 } from "three";

import * as Scene from "../../scenes/Scene";

import * as Colors from "../base/Colors";
import * as PianoVisualization from "../base/PianoVisualization";

const SPEED = 3 / 1000;
const VERTICAL_SHARPNESS = 7;
const FLAPPINESS = 2;
const TIP_DISTANCE = 0.65; // 0 to 1
const TIP_FADE = 4;

// derived
const PERIOD = Math.PI * 2 / SPEED;

// TODO this could be made to work with any co-planar points, but right now it requires all Z
// positions to be the same
function mapTo2D(points3d: Vector3[]): Vector2[] {
  if (points3d.length === 0) {
    return [];
  }

  const z = points3d[0].z;
  return points3d.map(p => {
    if (Math.abs(p.z - z) > 0.00001) {
      throw new Error("all Z values must be the same");
    }
    return new Vector2(p.x, p.y);
  });
}

function flatten<T>(arrays: T[][]): T[] {
  const output: T[] = [];
  arrays.forEach(arr => arr.forEach(v => output.push(v)));
  return output;
}

export default class VoronoiMapperVisualization extends PianoVisualization.default {
  private phase = 0;

  constructor(scene: Scene.default) {
    super(scene);
    const allLeds = flatten(scene.leds);
    mapTo2D(allLeds.map(led => led.position));
  }

  public render(elapsedMillis: number, state: PianoVisualization.State, context: PianoVisualization.Context): void {
    this.phase = (this.phase + elapsedMillis * SPEED) % PERIOD;

    const positionNormalized = Math.pow(Math.sin(this.phase), FLAPPINESS);
    const position = positionNormalized * (this.ledRows.length - 1);

    this.ledRows.forEach((leds, row) => {
      const rowV = Math.pow(1 - (Math.abs(position - row) / (this.ledRows.length)), VERTICAL_SHARPNESS);
      const rowColor = Colors.hsv(0, 0, rowV);
      for (let i = 0; i < leds.length; ++i) {
        // -1 on left, 0 in middle, 1 on right
        const x = (i - (leds.length - 1) / 2) / ((leds.length - 1) / 2);

        // 1 at the tips, 0 where tips "start"
        const tippiness = Math.max(0, Math.abs(x) - TIP_DISTANCE) / (1 - TIP_DISTANCE);
        const color = Colors.multiply(rowColor, Math.pow(1 - tippiness, TIP_FADE));
        leds.set(i, color);
      }
    });

    context.setFrameTimeseriesPoints([{
      color: Colors.WHITE,
      value: 1 - positionNormalized
    }]);
  }
}
