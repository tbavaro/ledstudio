import * as Visualization from "../../base/Visualization";

import StaticImageVisualization from "../../visualizationUtils/StaticImageVisualization";

export default class PatternOwlEyesVisualization extends StaticImageVisualization {
  constructor(config: Visualization.Config) {
    super(config, "./owleyes.jpg");
  }
}
