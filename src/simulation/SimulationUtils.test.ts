import { Vector2, Vector3 } from "three";

import * as SimulationUtils from "./SimulationUtils";

it("map2dTo3d: simple", () => {
  const points3d = SimulationUtils.map2dTo3d({
    points: [
      new Vector2(0, 0),
      new Vector2(1, 0),
      new Vector2(1, 1),
      new Vector2(0, 1),
      new Vector2(0.25, 0.5),
    ],
    bottomLeft: new Vector3(0, 0, 0),
    rightDirection: new Vector3(1, 0, 0),
    upDirection: new Vector3(0, 1, 0)
  });

  expect(points3d).toEqual([
    new Vector3(0, 0, 0),
    new Vector3(1, 0, 0),
    new Vector3(1, 1, 0),
    new Vector3(0, 1, 0),
    new Vector3(0.25, 0.5, 0)
  ]);
});

it("map2dTo3d: reject nonsense angles", () => {
  expect(() => {
    SimulationUtils.map2dTo3d({
      points: [
        new Vector2(0, 0)
      ],
      bottomLeft: new Vector3(0, 0, 0),
      rightDirection: new Vector3(1, 1, 0),
      upDirection: new Vector3(1, 0, 0)
    });
  }).toThrow();
});
