import LedStrip from "./base/LedStrip";
import PianoVisualization from "./base/PianoVisualization";

import CenterSpreadVisualization from "./visualizations/CenterSpreadVisualization";
import GlowWaveisualization from "./visualizations/GlowWaveVisualization";
import TestBounceVisualization from "./visualizations/TestBounceVisualization";
import TestKeyFadeVisualization from "./visualizations/TestKeyFadeVisualization";
import TestKeyVisualization from "./visualizations/TestKeyVisualization";
import TestRainbowVisualization from "./visualizations/TestRainbowVisualization";
import TestStripAddressVisualization from "./visualizations/TestStripAddressVisualization";

const visFuncs = {
  "glowWave": (ledStrip: LedStrip) => new GlowWaveisualization(ledStrip),
  "centerSpread": (ledStrip: LedStrip) => new CenterSpreadVisualization(ledStrip),
  "testBounce": (ledStrip: LedStrip) => new TestBounceVisualization(ledStrip),
  "testKey": (ledStrip: LedStrip) => new TestKeyVisualization(ledStrip),
  "testKeyFade": (ledStrip: LedStrip) => new TestKeyFadeVisualization(ledStrip),
  "testRainbow": (ledStrip: LedStrip) => new TestRainbowVisualization(ledStrip),
  "testStripAddress": (ledStrip: LedStrip) => new TestStripAddressVisualization(ledStrip)
};

export type Name = keyof typeof visFuncs;

export const defaultName: Name = "glowWave";

export const names: ReadonlyArray<Name> = Object.keys(visFuncs) as Name[];
export function create(name: Name, ledStrip: LedStrip): PianoVisualization {
  if (!(name in visFuncs)) {
    throw new Error("unrecognized name");
  }
  return visFuncs[name](ledStrip);
}
