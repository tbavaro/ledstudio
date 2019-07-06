import * as Visualization from "./base/Visualization";

import CenterSpreadVisualization from "./visualizations/CenterSpreadVisualization";
import ExpandingDashesVisualization from "./visualizations/ExpandingDashesVisualization";
import GlowWaveVisualization from "./visualizations/GlowWaveVisualization";
import PatternClockVisualization from "./visualizations/PatternClockVisualization";
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
import PulsingRainVisualization from "./visualizations/PulsingRainVisualization";
import ScopeFFTVisualization from "./visualizations/ScopeFFTVisualization";
import ScopeWaveformVisualization from "./visualizations/ScopeWaveformVisualization";
import SparklesAndFlashesVisualization from "./visualizations/SparklesAndFlashesVisualization";
import SplotchesVisualization from "./visualizations/SplotchesVisualization";
import SpreadShootersAudioVisualization from "./visualizations/SpreadShootersAudioVisualization";
import TestAbletonLink from "./visualizations/TestAbletonLink";
import TestAnalogPulseVisualization from "./visualizations/TestAnalogPulseVisualization";
import TestAudioAndAbletonLink from "./visualizations/TestAudioAndAbletonLink";
import TestAudioWaveformVisualization from "./visualizations/TestAudioWaveformVisualization";
import TestControllerDialVisualization from "./visualizations/TestControllerDialVisualization";
import TestKeyFadeVisualization from "./visualizations/TestKeyFadeVisualization";
import TestKeyVisualization from "./visualizations/TestKeyVisualization";
import TestLevelsVisualization from "./visualizations/TestLevelsVisualization";
import TestPlaylistVisualization from "./visualizations/TestPlaylistVisualization";
import TestStripAddressVisualization from "./visualizations/TestStripAddressVisualization";
import TestTimeseriesDataVisualization from "./visualizations/TestTimeseriesDataVisualization";
import TestVisualizerExtraDisplayVisualization from "./visualizations/TestVisualizerExtraDisplayVisualization";

const factories: Visualization.Factory[] = [
  GlowWaveVisualization,
  CenterSpreadVisualization,
  SparklesAndFlashesVisualization,
  SplotchesVisualization,
  SpreadShootersAudioVisualization,
  ExpandingDashesVisualization,
  ScopeFFTVisualization,
  ScopeWaveformVisualization,
  PatternClockVisualization,
  PatternDotVisualization,
  PatternFlagVisualization,
  PatternMarqueeVisualization,
  PatternOwlEyesVisualization,
  PatternParticleFireVisualization,
  PatternRainVisualization,
  PatternRain2Visualization,
  PatternRainbowVisualization,
  PatternSparklesVisualization,
  PatternWingFlapVisualization,
  PatternZapsVisualization,
  PatternZoomVisualization,
  PulsingRainVisualization,
  TestAbletonLink,
  TestAudioAndAbletonLink,
  TestAnalogPulseVisualization,
  TestAudioWaveformVisualization,
  TestControllerDialVisualization,
  TestKeyVisualization,
  TestKeyFadeVisualization,
  TestLevelsVisualization,
  TestPlaylistVisualization,
  TestStripAddressVisualization,
  TestTimeseriesDataVisualization,
  TestVisualizerExtraDisplayVisualization
];

export type Name = string;

export const defaultName: Name = "testStripAddress";

const map = new Map<string, Visualization.Factory>();
factories.forEach(f => {
  if (map.has(f.name)) {
    throw new Error(`duplicate visualization name: ${f.name}`);
  }
  map.set(f.name, f);
});

export const names: ReadonlyArray<Name> = Array.from(map.keys());
export function create(name: Name, config: Visualization.Config): Visualization.default {
  const factory = map.get(name);
  if (factory === undefined) {
    throw new Error("unrecognized name");
  }
  return factory.create(config);
}

export function isValidName(name: Name): boolean {
  return map.has(name);
}
