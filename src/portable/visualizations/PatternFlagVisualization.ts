import Scene from "../../scenes/Scene";

import StaticImageVisualization from "./util/StaticImageVisualization";

export default class PatternFlagVisualization extends StaticImageVisualization {
  constructor(scene: Scene) {
    super(scene, "./flag.jpg");
  }
}