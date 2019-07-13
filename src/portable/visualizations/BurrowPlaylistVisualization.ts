import * as Visualization from "../base/Visualization";
import { PlaylistVisualization } from "./util/PlaylistVisualization";

import ExpandingDashesVisualization from "./ExpandingDashesVisualization";
import FourierTwinkleVisualization from "./FourierTwinkleVisualization";
import PatternClockVisualization, { DerezPatternClockVisualizationFactory } from "./PatternClockVisualization";
import PatternDotVisualization, { DerezPatternDotVisualizationFactory } from "./PatternDotVisualization";
import PatternMarqueeVisualization from "./PatternMarqueeVisualization";
import PatternParticleFireVisualization, { DerezPatternParticleFireVisualizationFactory } from "./PatternParticleFireVisualization";
import PatternRainbowVisualization, { DerezPatternRainbowVisualizationFactory } from "./PatternRainbowVisualization";
import PatternSparklesVisualization from "./PatternSparklesVisualization";
import PatternWingFlapVisualization from "./PatternWingFlapVisualization";
import PatternZapsVisualization from "./PatternZapsVisualization";
import PatternZoomVisualization, { DerezPatternZoomVisualizationFactory } from "./PatternZoomVisualization";
import PulsingRainVisualization from "./PulsingRainVisualization";
// import SparklesAndFlashesVisualization from "./SparklesAndFlashesVisualization";
import SplotchesVisualization, { DerezSplotchesVisualizationFactory } from "./SplotchesVisualization";
import SpreadShootersAudioVisualization, { DerezSpreadShootersAudioVisualizationFactory } from "./SpreadShootersAudioVisualization";
const NAME = "burrowPlaylist";

class BurrowPlaylistVisualization extends PlaylistVisualization {
  constructor(config: Visualization.Config) {
    super(config, {
      visualizations: [
        {name: "Expanding Dashes", factory: ExpandingDashesVisualization, duration: 7*60},
        {name: "Sparkles", factory: PatternSparklesVisualization, duration: 2*60},
        {name: "Dot", factory: PatternDotVisualization, duration: 1*60},
        {name: "Fourier Twinkle", factory: FourierTwinkleVisualization, duration: 4*60},
        {name: "Clock", factory: PatternClockVisualization, duration: 1*60},
        {name: "Fire", factory: PatternParticleFireVisualization, duration: 2*60},
        {name: "Derez Shooters", factory: DerezSpreadShootersAudioVisualizationFactory, duration: 7*60},
        {name: "Rainbow", factory: PatternRainbowVisualization, duration: 4*60},
        {name: "Flap", factory: PatternWingFlapVisualization, duration: 1*60},
        {name: "Pulsing Rain", factory: PulsingRainVisualization, duration: 7*60},
        {name: "Derez Zoom", factory: DerezPatternZoomVisualizationFactory, duration: 4*60},
        {name: "Marquee", factory: PatternMarqueeVisualization, duration: 1*60},
        {name: "Splotches", factory: SplotchesVisualization, duration: 5*60},
        {name: "Derez Clock", factory: DerezPatternClockVisualizationFactory, duration: 1*60},
        {name: "Derez Fire", factory: DerezPatternParticleFireVisualizationFactory, duration: 3*60},
        {name: "Marquee", factory: PatternMarqueeVisualization, duration: 1*60},
        {name: "Zoom", factory: PatternZoomVisualization, duration: 4*60},
        {name: "Derez Rainbow", factory: DerezPatternRainbowVisualizationFactory, duration: 4*60},
        {name: "Zaps", factory: PatternZapsVisualization, duration: 1*60},
        {name: "Derez Dot", factory: DerezPatternDotVisualizationFactory, duration: 3*60},
        {name: "Clock", factory: PatternClockVisualization, duration: 1*60},
        {name: "Shooters", factory: SpreadShootersAudioVisualization, duration: 7*60},
        {name: "Flap", factory: PatternWingFlapVisualization, duration: 1*60},
        {name: "Derez Splotches", factory: DerezSplotchesVisualizationFactory, duration: 5*60},
        {name: "Marquee", factory: PatternMarqueeVisualization, duration: 1*60},
        {name: "Sparkles", factory: PatternSparklesVisualization, duration: 2*60},
      ]
    });
  }
}

export const BurrowPlaylist = new Visualization.Factory(NAME, BurrowPlaylistVisualization);
