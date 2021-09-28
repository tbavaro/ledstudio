// import * as Colors from "../base/Colors";
import MappedCanvasVisualization from "src/portable/visualizationUtils/MappedCanvasVisualization";

import * as Visualization from "../../base/Visualization";
import VideoFile from "./lines.mp4";

export default class MyVisualization extends MappedCanvasVisualization {
  private video = (() => {
    const video = document.createElement("video");
    video.src = VideoFile;
    video.autoplay = true;
    video.loop = true;
    video.style.display = "none";
    video.width = 10;
    video.height = 10;
    this.canvas.appendChild(video);
    return video;
  })();

  protected renderToCanvas(context: Visualization.FrameContext) {
    const { canvas, canvasContext: ctx, video } = this;

    // ctx.globalCompositeOperation = "saturation";
    // ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  }
}
