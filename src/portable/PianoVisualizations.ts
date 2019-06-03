import LedInfo from "./base/LedInfo";
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

function countsOnly(ledInfos: LedInfo[][]): number[] {
  return ledInfos.map(row => row.length);
}

const visFuncs = {
  "glowWave": (ledInfos: LedInfo[][]) => new GlowWaveVisualization(countsOnly(ledInfos)),
  "centerSpread": () => new CenterSpreadVisualization(),
  "wingFlap": (ledInfos: LedInfo[][]) => new WingFlapVisualization(countsOnly(ledInfos)),
  "testAnalogPulse": (ledInfos: LedInfo[][]) => new TestAnalogPulseVisualization(countsOnly(ledInfos)),
  "testKey": () => new TestKeyVisualization(),
  "testKeyFade": () => new TestKeyFadeVisualization(),
  "testRainbow": (ledInfos: LedInfo[][]) => new TestRainbowVisualization(countsOnly(ledInfos)),
  "testStripAddress": (ledInfos: LedInfo[][]) => new TestStripAddressVisualization(ledInfos),
  "testTimeseriesDataVisualization": () => new TestTimeseriesDataVisualization()
};

export type Name = keyof typeof visFuncs;

export const defaultName: Name = "testStripAddress";

export const names: ReadonlyArray<Name> = Object.keys(visFuncs) as Name[];
export function create(name: Name, ledInfos: LedInfo[][]): PianoVisualization {
  if (!(name in visFuncs)) {
    throw new Error("unrecognized name");
  }
  return visFuncs[name](ledInfos);
}

export function isValidName(name: Name): boolean {
  return name in visFuncs;
}
