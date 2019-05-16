import PianoVisualization, { ColorRow } from "./base/PianoVisualization";

import CenterSpreadVisualization from "./visualizations/CenterSpreadVisualization";
// import GlowWaveisualization from "./visualizations/GlowWaveVisualization";
// import TestKeyFadeVisualization from "./visualizations/TestKeyFadeVisualization";
// import TestKeyVisualization from "./visualizations/TestKeyVisualization";
import TestRainbowVisualization from "./visualizations/TestRainbowVisualization";
// import TestStripAddressVisualization from "./visualizations/TestStripAddressVisualization";

const visFuncs = {
  // "glowWave": (leds: ColorRow) => new GlowWaveisualization(ledStrip),
  "centerSpread": (leds: ColorRow) => new CenterSpreadVisualization(leds),
  // "testKey": (leds: ColorRow) => new TestKeyVisualization(ledStrip),
  // "testKeyFade": (leds: ColorRow) => new TestKeyFadeVisualization(ledStrip),
  "testRainbow": (leds: ColorRow) => new TestRainbowVisualization(leds),
  // "testStripAddress": (leds: ColorRow) => new TestStripAddressVisualization(ledStrip)
};

export type Name = keyof typeof visFuncs;

export const defaultName: Name = "centerSpread";

export const names: ReadonlyArray<Name> = Object.keys(visFuncs) as Name[];
export function create(name: Name, leds: ColorRow): PianoVisualization {
  if (!(name in visFuncs)) {
    throw new Error("unrecognized name");
  }
  return visFuncs[name](leds);
}
