import * as Visualization from "../../base/Visualization";

import StaticImageVisualization from "../../visualizationUtils/StaticImageVisualization";

export default class PatternFlagVisualization extends StaticImageVisualization {
  constructor(config: Visualization.Config) {
    super(config, "./flag.jpg");
  }
}
