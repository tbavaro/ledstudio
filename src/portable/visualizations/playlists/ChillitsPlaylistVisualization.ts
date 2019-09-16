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

export default class ChillitsPlaylistVisualization extends PlaylistVisualization {
  constructor(config: Visualization.Config) {
    super(config, {
      visualizations: [
        {displayName: "Expanding Dashes", visualization: ExpandingDashesVisualization, duration: 2*60},
        {displayName: "Sparkles", visualization: PatternSparklesVisualization, duration: 1.5*60},
        {displayName: "Dot", visualization: PatternDotVisualization, duration: 1*60},
        {displayName: "Fourier Twinkle", visualization: FourierTwinkleVisualization, duration: 2*60},
        {displayName: "Clock", visualization: PatternClockVisualization, duration: 0.5*60},
        {displayName: "Fire", visualization: PatternParticleFireVisualization, duration: 1*60},
        {displayName: "Derez Shooters", visualization: DerezSpreadShootersAudioVisualization, duration: 2*60},
        {displayName: "Rainbow", visualization: PatternRainbowVisualization, duration: 1.5*60},
        {displayName: "Flap", visualization: PatternWingFlapVisualization, duration: 0.5*60},
        {displayName: "Pulsing Rain", visualization: PulsingRainVisualization, duration: 2*60},
        {displayName: "Derez Zoom", visualization: DerezPatternZoomVisualization, duration: 2*60},
        {displayName: "Marquee", visualization: PatternMarqueeVisualization, duration: 0.5*60},
        {displayName: "Splotches", visualization: SplotchesVisualization, duration: 1.5*60},
        {displayName: "Derez Clock", visualization: DerezPatternClockVisualization, duration: 0.5*60},
        {displayName: "Expanding Dashes", visualization: ExpandingDashesVisualization, duration: 2*60},
        {displayName: "Derez Fire", visualization: DerezPatternParticleFireVisualization, duration: 1.5*60},
        {displayName: "Marquee", visualization: PatternMarqueeVisualization, duration: 0.5*60},
        {displayName: "Zoom", visualization: PatternZoomVisualization, duration: 2*60},
        {displayName: "Derez Rainbow", visualization: DerezPatternRainbowVisualization, duration: 1.5*60},
        {displayName: "Zaps", visualization: PatternZapsVisualization, duration: 0.5*60},
        {displayName: "Sparkles", visualization: PatternSparklesVisualization, duration: 1.5*60},
        {displayName: "Derez Dot", visualization: DerezPatternDotVisualization, duration: 1*60},
        {displayName: "Clock", visualization: PatternClockVisualization, duration: 0.5*60},
        {displayName: "Shooters", visualization: SpreadShootersAudioVisualization, duration: 2*60},
        {displayName: "Flap", visualization: PatternWingFlapVisualization, duration: 0.5*60},
        {displayName: "Derez Splotches", visualization: DerezSplotchesVisualization, duration: 1.5*60},
        {displayName: "Marquee", visualization: PatternMarqueeVisualization, duration: 0.5*60},
      ]
    });
  }
}
