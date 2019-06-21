import Scene from "../scenes/Scene";

import PianoVisualization from "./base/PianoVisualization";

import CenterSpreadVisualization from "./visualizations/CenterSpreadVisualization";
import GlowWaveVisualization from "./visualizations/GlowWaveVisualization";
import PatternFlagVisualization from "./visualizations/PatternFlagVisualization";
import PatternOwlEyesVisualization from "./visualizations/PatternOwlEyesVisualization";
import PatternSparklesVisualization from "./visualizations/PatternSparklesVisualization";
import PatternWingFlapVisualization from "./visualizations/PatternWingFlapVisualization";
import PatternZapsVisualization from "./visualizations/PatternZapsVisualization";
import TestAnalogPulseVisualization from "./visualizations/TestAnalogPulseVisualization";
import TestControllerDialVisualization from "./visualizations/TestControllerDialVisualization";
import TestKeyFadeVisualization from "./visualizations/TestKeyFadeVisualization";
import TestKeyVisualization from "./visualizations/TestKeyVisualization";
import TestRainbowVisualization from "./visualizations/TestRainbowVisualization";
import TestStripAddressVisualization from "./visualizations/TestStripAddressVisualization";
import TestTimeseriesDataVisualization from "./visualizations/TestTimeseriesDataVisualization";

const visFuncs = {
  "glowWave": GlowWaveVisualization,
  "centerSpread": CenterSpreadVisualization,
  "pattern:flag": PatternFlagVisualization,
  "pattern:owlEyes": PatternOwlEyesVisualization,
  "pattern:sparkles": PatternSparklesVisualization,
  "pattern:wingFlap": PatternWingFlapVisualization,
  "pattern:zaps": PatternZapsVisualization,
  "testAnalogPulse": TestAnalogPulseVisualization,
  "testControllerDial": TestControllerDialVisualization,
  "testKey": TestKeyVisualization,
  "testKeyFade": TestKeyFadeVisualization,
  "testRainbow": TestRainbowVisualization,
  "testStripAddress": TestStripAddressVisualization,
  "testTimeseriesDataVisualization": TestTimeseriesDataVisualization
};

export type Name = keyof typeof visFuncs;

export const defaultName: Name = "testStripAddress";

export const names: ReadonlyArray<Name> = Object.keys(visFuncs) as Name[];
export function create(name: Name, scene: Scene): PianoVisualization {
  if (!(name in visFuncs)) {
    throw new Error("unrecognized name");
  }
  return new visFuncs[name](scene);
}

export function isValidName(name: Name): boolean {
  return name in visFuncs;
}
