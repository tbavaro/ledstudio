import * as Visualization from "../base/Visualization";
import PlaylistVisualization from "./util/PlaylistVisualization";

import PatternRainbowVisualization from "./PatternRainbowVisualization";
import PatternSparklesVisualization from "./PatternSparklesVisualization";
import SplotchesVisualization from "./SplotchesVisualization";
import TestTimeseriesDataVisualization from "./TestTimeseriesDataVisualization";

const NAME = "testPlaylist";

class TestPlaylistVisualization extends PlaylistVisualization {
  constructor(config: Visualization.Config) {
    super(config, {
      autoAdvanceMillis: 5000,
      visualizations: [
        PatternSparklesVisualization,
        PatternRainbowVisualization,
        TestTimeseriesDataVisualization,
        SplotchesVisualization
      ]
    });
  }
}

const factory = new Visualization.Factory(NAME, TestPlaylistVisualization);
export default factory;
