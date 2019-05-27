import * as React from "react";

import "./AnalogAudioView.css";

const HEIGHT = 64;

export default class AnalogAudioView extends React.PureComponent<{}, {}> {
  private canvas: HTMLCanvasElement | undefined = undefined;
  private canvasContext: CanvasRenderingContext2D | undefined = undefined;
  private valuesBuffer: number[] = new Array(HEIGHT).fill(0);

  public render() {
    return (
      <canvas className="AnalogAudioView" ref={this.setRef} height={`${HEIGHT}px`} width="500px"/>
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

  public displayData(frequencyData: Uint8Array) {
    const values = this.valuesBuffer;
    if (frequencyData.length % values.length !== 0) {
      throw new Error("frequency data isn't an even mutiple of HEIGHT");
    }

    const canvas = this.canvas;
    const ctx = this.canvasContext;
    if (canvas === undefined || ctx === undefined) {
      return;
    }

    const binBatchSize = frequencyData.length / values.length;

    values.fill(0);
    frequencyData.forEach((v, i) => {
      const idx = Math.floor(i / binBatchSize);
      values[idx] += (v / binBatchSize);
    });

    // shift everything left 1px
    const imageData = ctx.getImageData(1, 0, canvas.width - 1, canvas.height);
    ctx.putImageData(imageData, 0, 0);

    let total = 0;

    values.forEach((v, i) => {
      total += v;
      ctx.fillStyle = `rgb(${v}, 0, 0)`;
      ctx.fillRect(canvas.width - 1, i, 1, 1);
    });

    total = total / values.length;
    ctx.fillStyle = `rgb(255, 255, 255)`;
    ctx.fillRect(canvas.width - 1, (total / 255 * canvas.height), 1, 5);
  }
}
