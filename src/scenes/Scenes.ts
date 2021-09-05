import BurrowRealWingsScene from "./BurrowRealWingsScene";
import GarageRealWingsScene from "./GarageRealWingsScene";
import PianoThreeStripesScene from "./PianoThreeStripesScene";
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
  new BurrowRealWingsScene("burrow:wings30x4-real"),
  new GarageRealWingsScene("garage:wings30x4-real")
]);
