import * as Visualization from "../base/Visualization";

import StaticImageVisualization from "./util/StaticImageVisualization";

const NAME = "pattern:flag";

class PatternFlagVisualization extends StaticImageVisualization {
  constructor(config: Visualization.Config) {
    super(config, "./flag.jpg");
  }
}

const factory = new Visualization.Factory(NAME, PatternFlagVisualization);
export default factory;
