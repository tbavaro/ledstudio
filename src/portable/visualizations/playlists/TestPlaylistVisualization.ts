import * as Visualization from "../../base/Visualization";
import { PlaylistVisualization } from "../../visualizationUtils/PlaylistVisualization";
import PatternMarqueeVisualization from "../patterns/PatternMarqueeVisualization";
import PatternRainbowVisualization from "../patterns/PatternRainbowVisualization";
import PatternZoomVisualization from "../patterns/PatternZoomVisualization";

export default class TestPlaylistVisualization extends PlaylistVisualization {
  constructor(config: Visualization.Config) {
    super(config, {
      visualizations: [
        {
          displayName: "Rainbow",
          visualization: PatternRainbowVisualization,
          duration: 5
        },
        {
          displayName: "Zoom",
          visualization: PatternZoomVisualization,
          duration: 5
        },
        {
          displayName: "Marquee",
          visualization: PatternMarqueeVisualization,
          duration: 5
        }
      ]
    });
  }
}
