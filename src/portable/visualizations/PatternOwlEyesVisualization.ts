import * as Visualization from "../base/Visualization";

import StaticImageVisualization from "./util/StaticImageVisualization";

const NAME = "pattern:owlEyes";

class PatternOwlEyesVisualization extends StaticImageVisualization {
  constructor(config: Visualization.Config) {
    super(config, "./owleyes.jpg");
  }
}

const factory = new Visualization.Factory(NAME, PatternOwlEyesVisualization);
export default factory;
