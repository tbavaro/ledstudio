import * as Visualization from "../../base/Visualization";
import { PlaylistVisualization } from "../../visualizationUtils/PlaylistVisualization";

import PatternMarqueeVisualization from "../patterns/PatternMarqueeVisualization";
import PatternRainbowVisualization from "../patterns/PatternRainbowVisualization";
import PatternZoomVisualization from "../patterns/PatternZoomVisualization";

export default class TestPlaylistVisualization extends PlaylistVisualization {
  constructor(config: Visualization.Config) {
    super(config, {
      visualizations: [
        {name: "Rainbow", factory: PatternRainbowVisualization, duration: 5},
        {name: "Zoom", factory: PatternZoomVisualization, duration: 5},
        {name: "Marquee", factory: PatternMarqueeVisualization, duration: 5},
      ]
    });
  }
}
