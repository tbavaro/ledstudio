import * as Visualization from "./base/Visualization";
import { VisualizationRegistryFactory } from "./VisualizationRegistry";

import BeatRainVisualization from "./visualizations/BeatRainVisualization";
import { BurrowPlaylist } from "./visualizations/BurrowPlaylistVisualization";
import CenterSpreadVisualization from "./visualizations/CenterSpreadVisualization";
import ExpandingDashesVisualization from "./visualizations/ExpandingDashesVisualization";
import FourierTwinkleVisualization from "./visualizations/FourierTwinkleVisualization";
import GlowWaveVisualization from "./visualizations/GlowWaveVisualization";
import PatternClockVisualization from "./visualizations/PatternClockVisualization";
import PatternDotVisualization from "./visualizations/PatternDotVisualization";
import PatternFlagVisualization from "./visualizations/PatternFlagVisualization";
import PatternMarqueeVisualization from "./visualizations/PatternMarqueeVisualization";
import PatternOwlEyesVisualization from "./visualizations/PatternOwlEyesVisualization";
import PatternParticleFireVisualization from "./visualizations/PatternParticleFireVisualization";
import PatternRain2Visualization from "./visualizations/PatternRain2Visualization";
import PatternRainbowVisualization from "./visualizations/PatternRainbowVisualization";
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
import TestAudioAndAbletonLink from "./visualizations/TestAudioAndAbletonLink";
import TestAudioPulseVisualization from "./visualizations/TestAudioPulseVisualization";
import TestAudioWaveformVisualization from "./visualizations/TestAudioWaveformVisualization";
import TestControllerDialVisualization from "./visualizations/TestControllerDialVisualization";
import TestKeyFadeVisualization from "./visualizations/TestKeyFadeVisualization";
import TestKeyVisualization from "./visualizations/TestKeyVisualization";
import TestLevelsVisualization from "./visualizations/TestLevelsVisualization";
import TestPlaylistVisualization from "./visualizations/TestPlaylistVisualization";
import TestSignalsVisualization from "./visualizations/TestSignalsVisualization";
import TestStripAddressVisualization from "./visualizations/TestStripAddressVisualization";
import TestTimeseriesDataVisualization from "./visualizations/TestTimeseriesDataVisualization";
import TestVisualizerExtraDisplayVisualization from "./visualizations/TestVisualizerExtraDisplayVisualization";

const factories: Visualization.Factory[] = [
  BurrowPlaylist,
  GlowWaveVisualization,
  CenterSpreadVisualization,
  SparklesAndFlashesVisualization,
  SplotchesVisualization,
  SpreadShootersAudioVisualization,
  ExpandingDashesVisualization,
  FourierTwinkleVisualization,
  BeatRainVisualization,
  ScopeFFTVisualization,
  ScopeWaveformVisualization,
  PatternClockVisualization,
  PatternDotVisualization,
  PatternFlagVisualization,
  PatternMarqueeVisualization,
  PatternOwlEyesVisualization,
  PatternParticleFireVisualization,
  PatternRain2Visualization,
  PatternRainbowVisualization,
  PatternSparklesVisualization,
  PatternWingFlapVisualization,
  PatternZapsVisualization,
  PatternZoomVisualization,
  PulsingRainVisualization,
  TestAbletonLink,
  TestAudioAndAbletonLink,
  TestAudioPulseVisualization,
  TestAudioWaveformVisualization,
  TestControllerDialVisualization,
  TestKeyVisualization,
  TestKeyFadeVisualization,
  TestLevelsVisualization,
  TestPlaylistVisualization,
  TestSignalsVisualization,
  TestStripAddressVisualization,
  TestTimeseriesDataVisualization,
  TestVisualizerExtraDisplayVisualization
];

const registryFactory = new VisualizationRegistryFactory();
factories.forEach(f => registryFactory.add(f));

export const registry = registryFactory.build();
