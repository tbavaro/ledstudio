import * as Visualization from "../base/Visualization";

import StaticImageVisualization from "./util/StaticImageVisualization";

export default class PatternOwlEyesVisualization extends StaticImageVisualization {
  constructor(config: Visualization.Config) {
    super(config, "./owleyes.jpg");
  }
}