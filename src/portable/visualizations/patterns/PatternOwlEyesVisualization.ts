import * as Visualization from "../../base/Visualization";

import StaticImageVisualization from "../../visualizationUtils/StaticImageVisualization";

const GROUP_NAME = "patterns";
const NAME = "pattern:owlEyes";

class PatternOwlEyesVisualization extends StaticImageVisualization {
  constructor(config: Visualization.Config) {
    super(config, "./owleyes.jpg");
  }
}

const factory = new Visualization.Factory({ groupName: GROUP_NAME, name: NAME, ctor: PatternOwlEyesVisualization });
export default factory;
