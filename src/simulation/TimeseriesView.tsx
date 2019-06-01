import * as React from "react";

import * as Colors from "../portable/base/Colors";
import * as TimeseriesData from "../portable/base/TimeseriesData";

import "./TimeseriesView.css";

interface Props {
  height: number;
}

const POINT_VALUE_HEIGHT = 2;

export default class TimeseriesView extends React.PureComponent<Props, {}> {
  private canvas: HTMLCanvasElement | undefined = undefined;
  private canvasContext: CanvasRenderingContext2D | undefined = undefined;

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
  }

  public displayData(points: TimeseriesData.PointDef[], heatmap?: TimeseriesData.HeatmapDef) {
    const canvas = this.canvas;
    const ctx = this.canvasContext;
    if (canvas === undefined || ctx === undefined) {
      return;
    }

    // shift everything left 1px
    const imageData = ctx.getImageData(1, 0, canvas.width - 1, canvas.height);
    ctx.putImageData(imageData, 0, 0);

    if (heatmap !== undefined) {
      const dy = canvas.height / heatmap.values.length;
      const baseColor = heatmap.baseColor;
      heatmap.values.forEach((v, i) => {
        ctx.fillStyle = Colors.cssColor(Colors.multiply(baseColor, v));
        ctx.fillRect(canvas.width - 1, i * dy, 1, dy);
      });
    }

    for (let i = points.length - 1; i >= 0; --i) {
      const p = points[i];
      if (p.value !== null) {
        ctx.fillStyle = Colors.cssColor(p.color);
        ctx.fillRect(canvas.width - 1, p.value * canvas.height, 1, POINT_VALUE_HEIGHT);
      }
    }
  }
}
