import PianoVisualization from "./base/PianoVisualization";

import CenterSpreadVisualization from "./visualizations/CenterSpreadVisualization";
import GlowWaveVisualization from "./visualizations/GlowWaveVisualization";
import TestAnalogPulseVisualization from "./visualizations/TestAnalogPulseVisualization";
import TestKeyFadeVisualization from "./visualizations/TestKeyFadeVisualization";
import TestKeyVisualization from "./visualizations/TestKeyVisualization";
import TestRainbowVisualization from "./visualizations/TestRainbowVisualization";
import TestStripAddressVisualization from "./visualizations/TestStripAddressVisualization";
import TestTimeseriesDataVisualization from "./visualizations/TestTimeseriesDataVisualization";
import WingFlapVisualization from "./visualizations/WingFlapVisualization";

const visFuncs = {
  "glowWave": (numLeds: number[]) => new GlowWaveVisualization(numLeds),
  "centerSpread": () => new CenterSpreadVisualization(),
  "wingFlap": (numLeds: number[]) => new WingFlapVisualization(numLeds),
  "testAnalogPulse": (numLeds: number[]) => new TestAnalogPulseVisualization(numLeds),
  "testKey": () => new TestKeyVisualization(),
  "testKeyFade": () => new TestKeyFadeVisualization(),
  "testRainbow": (numLeds: number[]) => new TestRainbowVisualization(numLeds),
  "testStripAddress": (numLeds: number[]) => new TestStripAddressVisualization(numLeds),
  "testTimeseriesDataVisualization": () => new TestTimeseriesDataVisualization()
};

export type Name = keyof typeof visFuncs;

export const defaultName: Name = "testStripAddress";

export const names: ReadonlyArray<Name> = Object.keys(visFuncs) as Name[];
export function create(name: Name, numLeds: number[]): PianoVisualization {
  if (!(name in visFuncs)) {
    throw new Error("unrecognized name");
  }
  return visFuncs[name](numLeds);
}

export function isValidName(name: Name): boolean {
  return name in visFuncs;
}
