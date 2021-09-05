import { createPianoThreeStripesScene } from "./PianoThreeStripesScene";
import { createRealWingsSceneDef } from "./RealWingsScene";
import * as Scene from "./Scene";
import SceneDef from "./SceneDef";

export const registry = new Map<string, Scene.default>();

function registerScenes(defs: ReadonlyArray<SceneDef>) {
  defs.forEach(def => {
    const scene = new Scene.SceneImpl(def);
    const name = scene.name;
    if (registry.has(name)) {
      throw new Error(`scene already registered with name: ${name}`);
    }
    registry.set(name, scene);
  });
}

registerScenes([
  createPianoThreeStripesScene("keyboard:3stripes"),
  createRealWingsSceneDef("burrow:wings30x4-real")
]);
