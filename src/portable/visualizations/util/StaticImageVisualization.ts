import Scene from "../../../scenes/Scene";

import * as Visualization from "../../base/Visualization";

import AbstractVoronoiMapperVisualization from "./AbstractVoronoiMapperVisualization";

export default class StaticImageVisualization extends AbstractVoronoiMapperVisualization {
  constructor(scene: Scene, imageUrl: string) {
    super(scene);
    const imgElement = document.createElement("img");
    imgElement.onload = () => {
      this.canvasContext.drawImage(imgElement, 0, 0, imgElement.width, imgElement.height, 0, 0, this.canvas.width, this.canvas.height);
    };
    imgElement.src = imageUrl;
  }

  protected renderToCanvas(elapsedMillis: number, state: Visualization.State, context: Visualization.Context) {
    // no-op
  }
}