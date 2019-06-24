import * as Visualization from "./base/Visualization";

import CenterSpreadVisualization from "./visualizations/CenterSpreadVisualization";
import GlowWaveVisualization from "./visualizations/GlowWaveVisualization";
import PatternClockVisualization from "./visualizations/PatternClockVisualization";
import PatternDot2Visualization from "./visualizations/PatternDot2Visualization";
import PatternDotVisualization from "./visualizations/PatternDotVisualization";
import PatternFlagVisualization from "./visualizations/PatternFlagVisualization";
import PatternMarqueeVisualization from "./visualizations/PatternMarqueeVisualization";
import PatternOwlEyesVisualization from "./visualizations/PatternOwlEyesVisualization";
import PatternParticleFireVisualization from "./visualizations/PatternParticleFireVisualization";
import PatternRain2Visualization from "./visualizations/PatternRain2Visualization";
import PatternRainbowVisualization from "./visualizations/PatternRainbowVisualization";
import PatternRainVisualization from "./visualizations/PatternRainVisualization";
import PatternSparklesVisualization from "./visualizations/PatternSparklesVisualization";
import PatternWingFlapVisualization from "./visualizations/PatternWingFlapVisualization";
import PatternZapsVisualization from "./visualizations/PatternZapsVisualization";
import PatternZoomVisualization from "./visualizations/PatternZoomVisualization";
import SparklesAndFlashesVisualization from "./visualizations/SparklesAndFlashesVisualization";
import TestAbletonLink from "./visualizations/TestAbletonLink";
import TestAnalogPulseVisualization from "./visualizations/TestAnalogPulseVisualization";
import TestAudioAndAbletonLink from "./visualizations/TestAudioAndAbletonLink";
import TestAudioWaveformVisualization from "./visualizations/TestAudioWaveformVisualization";
import TestControllerDialVisualization from "./visualizations/TestControllerDialVisualization";
import TestKeyFadeVisualization from "./visualizations/TestKeyFadeVisualization";
import TestKeyVisualization from "./visualizations/TestKeyVisualization";
import TestStripAddressVisualization from "./visualizations/TestStripAddressVisualization";
import TestTimeseriesDataVisualization from "./visualizations/TestTimeseriesDataVisualization";
import TestVisualizerExtraDisplayVisualization from "./visualizations/TestVisualizerExtraDisplayVisualization";

const visFuncs = {
  "glowWave": GlowWaveVisualization,
  "centerSpread": CenterSpreadVisualization,
  "sparklesAndFlashes": SparklesAndFlashesVisualization,
  "pattern:clock": PatternClockVisualization,
  "pattern:dot": PatternDotVisualization,
  "pattern:dot2": PatternDot2Visualization,
  "pattern:flag": PatternFlagVisualization,
  "pattern:marquee": PatternMarqueeVisualization,
  "pattern:owlEyes": PatternOwlEyesVisualization,
  "pattern:particleFire": PatternParticleFireVisualization,
  "pattern:rain": PatternRainVisualization,
  "pattern:rain2": PatternRain2Visualization,
  "pattern:rainbow": PatternRainbowVisualization,
  "pattern:sparkles": PatternSparklesVisualization,
  "pattern:wingFlap": PatternWingFlapVisualization,
  "pattern:zaps": PatternZapsVisualization,
  "pattern:zoom": PatternZoomVisualization,
  "testAbletonLink": TestAbletonLink,
  "testAudioAndAbletonLink": TestAudioAndAbletonLink,
  "testAnalogPulse": TestAnalogPulseVisualization,
  "testAudioWaveform": TestAudioWaveformVisualization,
  "testControllerDial": TestControllerDialVisualization,
  "testKey": TestKeyVisualization,
  "testKeyFade": TestKeyFadeVisualization,
  "testStripAddress": TestStripAddressVisualization,
  "testTimeseriesData": TestTimeseriesDataVisualization,
  "testVisualizerExtraDisplay": TestVisualizerExtraDisplayVisualization
};

export type Name = keyof typeof visFuncs;

export const defaultName: Name = "testStripAddress";

export const names: ReadonlyArray<Name> = Object.keys(visFuncs) as Name[];
export function create(name: Name, config: Visualization.Config): Visualization.default {
  if (!(name in visFuncs)) {
    throw new Error("unrecognized name");
  }
  return new visFuncs[name](config);
}

export function isValidName(name: Name): boolean {
  return name in visFuncs;
}
