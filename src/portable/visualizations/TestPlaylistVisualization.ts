import * as Visualization from "../base/Visualization";
import PlaylistVisualization from "./util/PlaylistVisualization";

import PatternRainbowVisualization from "./PatternRainbowVisualization";
import PatternSparklesVisualization from "./PatternSparklesVisualization";

export default class TestPlaylistVisualization extends PlaylistVisualization {
  constructor(config: Visualization.Config) {
    super(config, {
      autoAdvanceMillis: 5000,
      visualizations: [
        PatternSparklesVisualization,
        PatternRainbowVisualization
      ]
    });
  }
}
