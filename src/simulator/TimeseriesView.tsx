import "./TimeseriesView.css";

import * as React from "react";

import * as Colors from "../portable/base/Colors";
import * as TimeseriesData from "../portable/base/TimeseriesData";

interface Props {
  height: number;
}

const POINT_VALUE_HEIGHT = 2;

// TODO could make this draw all the pixels and then scale so we don't miss values that get painted over
class HeatmapDrawHelper {
  // private canvas: HTMLCanvasElement;
  // private ctx: CanvasRenderingContext2D;

  constructor() {
    // this.canvas = document.createElement("canvas");
    // const ctx = this.canvas.getContext("2d");
    // if (ctx === null) {
    //   throw new Error("can't get 2d context");
    // }
    // this.ctx = ctx;
  }

  public drawHeatmapColumn(
    targetContext: CanvasRenderingContext2D,
    heatmap: TimeseriesData.HeatmapDef
  ) {
    const targetCanvas = targetContext.canvas;
    const dy = targetCanvas.height / heatmap.values.length;
    const baseColor = heatmap.baseColor;
    heatmap.values.forEach((v, i) => {
      targetContext.fillStyle = Colors.cssColor(Colors.multiply(baseColor, v));
      targetContext.fillRect(
        targetCanvas.width - 1,
        (heatmap.values.length - 1 - i) * dy,
        1,
        dy
      );
    });
  }
}

export default class TimeseriesView extends React.PureComponent<Props, {}> {
  private canvas: HTMLCanvasElement | undefined = undefined;
  private canvasContext: CanvasRenderingContext2D | undefined = undefined;

  private heatmapDrawHelper = new HeatmapDrawHelper();

  public render() {
    return (
      <canvas
        className="TimeseriesView"
        ref={this.setRef}
        height={`${this.props.height}px`}
        width="500px"
      />
    );
  }

  private setRef = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (ctx === null) {
      throw new Error("couldn't get canvas context");
    }
    this.canvas = canvas;
    this.canvasContext = ctx;
  };

  public displayData(
    points: TimeseriesData.PointDef[],
    heatmap?: TimeseriesData.HeatmapDef
  ) {
    const canvas = this.canvas;
    const ctx = this.canvasContext;
    if (canvas === undefined || ctx === undefined) {
      return;
    }

    // shift everything left 1px
    const imageData = ctx.getImageData(1, 0, canvas.width - 1, canvas.height);
    ctx.putImageData(imageData, 0, 0);

    if (heatmap !== undefined && heatmap.values.length > 0) {
      this.heatmapDrawHelper.drawHeatmapColumn(ctx, heatmap);
    } else {
      ctx.fillStyle = "black";
      ctx.fillRect(canvas.width - 1, 0, 1, canvas.height);
    }

    for (let i = points.length - 1; i >= 0; --i) {
      const p = points[i];
      if (!isNaN(p.value)) {
        ctx.fillStyle = Colors.cssColor(p.color);
        ctx.fillRect(
          canvas.width - 1,
          (1 - p.value) * (canvas.height - POINT_VALUE_HEIGHT),
          1,
          POINT_VALUE_HEIGHT
        );
      }
    }
  }
}
