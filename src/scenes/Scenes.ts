import PianoThreeStripesScene from "./PianoThreeStripesScene";
import RealWingsScene from "./RealWingsScene";
import Scene from "./Scene";

export const registry = new Map<string, Scene>();

function registerScenes(defs: ReadonlyArray<Scene>) {
  defs.forEach(scene => {
    const name = scene.name;
    if (registry.has(name)) {
      throw new Error(`scene already registered with name: ${name}`);
    }
    registry.set(name, scene);
  });
}

registerScenes([
  new PianoThreeStripesScene("keyboard:3stripes"),
  new RealWingsScene("burrow:wings30x4-real")
]);
