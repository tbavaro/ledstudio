import Scene from "../../scenes/Scene";

import StaticImageVisualization from "./util/StaticImageVisualization";

export default class PatternOwlEyesVisualization extends StaticImageVisualization {
  constructor(scene: Scene) {
    super(scene, "./owleyes.jpg");
  }
}