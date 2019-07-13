import * as Visualization from "../base/Visualization";
import { PlaylistVisualization } from "./util/PlaylistVisualization";

import PatternMarqueeVisualization from "./PatternMarqueeVisualization";
import PatternRainbowVisualization from "./PatternRainbowVisualization";
import PatternZoomVisualization from "./PatternZoomVisualization";

const NAME = "testPlaylist";

class TestPlaylistVisualization extends PlaylistVisualization {
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

const factory = new Visualization.Factory(NAME, TestPlaylistVisualization);
export default factory;
