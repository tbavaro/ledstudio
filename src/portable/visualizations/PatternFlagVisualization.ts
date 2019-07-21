import * as Visualization from "../base/Visualization";

import StaticImageVisualization from "./util/StaticImageVisualization";

const GROUP_NAME = "patterns";
const NAME = "pattern:flag";

class PatternFlagVisualization extends StaticImageVisualization {
  constructor(config: Visualization.Config) {
    super(config, "./flag.jpg");
  }
}

const factory = new Visualization.Factory({ groupName: GROUP_NAME, name: NAME, ctor: PatternFlagVisualization });
export default factory;
