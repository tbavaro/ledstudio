import PianoVisualization from "./base/PianoVisualization";

import CenterSpreadVisualization from "./visualizations/CenterSpreadVisualization";
import GlowWaveisualization from "./visualizations/GlowWaveVisualization";
import TestKeyFadeVisualization from "./visualizations/TestKeyFadeVisualization";
import TestKeyVisualization from "./visualizations/TestKeyVisualization";
import TestRainbowVisualization from "./visualizations/TestRainbowVisualization";
import TestStripAddressVisualization from "./visualizations/TestStripAddressVisualization";

const visFuncs = {
  "glowWave": (numLeds: number) => new GlowWaveisualization(numLeds),
  "centerSpread": (numLeds: number) => new CenterSpreadVisualization(numLeds),
  "testKey": (numLeds: number) => new TestKeyVisualization(numLeds),
  "testKeyFade": (numLeds: number) => new TestKeyFadeVisualization(numLeds),
  "testRainbow": (numLeds: number) => new TestRainbowVisualization(numLeds),
  "testStripAddress": (numLeds: number) => new TestStripAddressVisualization(numLeds)
};

export type Name = keyof typeof visFuncs;

export const defaultName: Name = "centerSpread";

export const names: ReadonlyArray<Name> = Object.keys(visFuncs) as Name[];
export function create(name: Name, numLeds: number): PianoVisualization {
  if (!(name in visFuncs)) {
    throw new Error("unrecognized name");
  }
  return visFuncs[name](numLeds);
}
