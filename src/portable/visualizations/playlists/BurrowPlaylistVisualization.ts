import * as Visualization from "../../base/Visualization";
import { PlaylistVisualization } from "../../visualizationUtils/PlaylistVisualization";

import ExpandingDashesVisualization from "../burrow/ExpandingDashesVisualization";
import FourierTwinkleVisualization from "../burrow/FourierTwinkleVisualization";
import PulsingRainVisualization from "../burrow/PulsingRainVisualization";
import SplotchesVisualization, { DerezSplotchesVisualization } from "../burrow/SplotchesVisualization";
import SpreadShootersAudioVisualization, { DerezSpreadShootersAudioVisualization } from "../burrow/SpreadShootersAudioVisualization";

import PatternClockVisualization, { DerezPatternClockVisualization } from "../patterns/PatternClockVisualization";
import PatternDotVisualization, { DerezPatternDotVisualization } from "../patterns/PatternDotVisualization";
import PatternMarqueeVisualization from "../patterns/PatternMarqueeVisualization";
import PatternParticleFireVisualization, { DerezPatternParticleFireVisualization } from "../patterns/PatternParticleFireVisualization";
import PatternRainbowVisualization, { DerezPatternRainbowVisualization } from "../patterns/PatternRainbowVisualization";
import PatternSparklesVisualization from "../patterns/PatternSparklesVisualization";
import PatternWingFlapVisualization from "../patterns/PatternWingFlapVisualization";
import PatternZapsVisualization from "../patterns/PatternZapsVisualization";
import PatternZoomVisualization, { DerezPatternZoomVisualization } from "../patterns/PatternZoomVisualization";
// import SparklesAndFlashesVisualization from "./SparklesAndFlashesVisualization";

export default class BurrowPlaylistVisualization extends PlaylistVisualization {
  constructor(config: Visualization.Config) {
    super(config, {
      visualizations: [
        {name: "Expanding Dashes", factory: ExpandingDashesVisualization, duration: 7*60},
        {name: "Sparkles", factory: PatternSparklesVisualization, duration: 2*60},
        {name: "Dot", factory: PatternDotVisualization, duration: 1*60},
        {name: "Fourier Twinkle", factory: FourierTwinkleVisualization, duration: 4*60},
        {name: "Clock", factory: PatternClockVisualization, duration: 1*60},
        {name: "Fire", factory: PatternParticleFireVisualization, duration: 2*60},
        {name: "Derez Shooters", factory: DerezSpreadShootersAudioVisualization, duration: 7*60},
        {name: "Rainbow", factory: PatternRainbowVisualization, duration: 4*60},
        {name: "Flap", factory: PatternWingFlapVisualization, duration: 1*60},
        {name: "Pulsing Rain", factory: PulsingRainVisualization, duration: 7*60},
        {name: "Derez Zoom", factory: DerezPatternZoomVisualization, duration: 4*60},
        {name: "Marquee", factory: PatternMarqueeVisualization, duration: 1*60},
        {name: "Splotches", factory: SplotchesVisualization, duration: 5*60},
        {name: "Derez Clock", factory: DerezPatternClockVisualization, duration: 1*60},
        {name: "Expanding Dashes", factory: ExpandingDashesVisualization, duration: 7*60},
        {name: "Derez Fire", factory: DerezPatternParticleFireVisualization, duration: 3*60},
        {name: "Marquee", factory: PatternMarqueeVisualization, duration: 1*60},
        {name: "Zoom", factory: PatternZoomVisualization, duration: 4*60},
        {name: "Derez Rainbow", factory: DerezPatternRainbowVisualization, duration: 4*60},
        {name: "Zaps", factory: PatternZapsVisualization, duration: 1*60},
        {name: "Derez Dot", factory: DerezPatternDotVisualization, duration: 3*60},
        {name: "Clock", factory: PatternClockVisualization, duration: 1*60},
        {name: "Shooters", factory: SpreadShootersAudioVisualization, duration: 7*60},
        {name: "Flap", factory: PatternWingFlapVisualization, duration: 1*60},
        {name: "Derez Splotches", factory: DerezSplotchesVisualization, duration: 5*60},
        {name: "Marquee", factory: PatternMarqueeVisualization, duration: 1*60},
        {name: "Sparkles", factory: PatternSparklesVisualization, duration: 2*60},
      ]
    });
  }
}
