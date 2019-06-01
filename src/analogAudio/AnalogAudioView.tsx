import * as Colors from "../portable/base/Colors";

import * as React from "react";

import TimeseriesView from "../simulation/TimeseriesView";

const HEIGHT = 64;

export default class AnalogAudioView extends React.PureComponent<{}, {}> {
  private ref?: TimeseriesView;
  private valuesBuffer: number[] = new Array(HEIGHT).fill(0);

  public render() {
    return (
      <TimeseriesView
        height={HEIGHT}
        ref={this.setRef}
      />
    );
  }

  private setRef = (newRef: TimeseriesView) => this.ref = newRef;

  public displayFrequencyData(frequencyData: Uint8Array) {
    const values = this.valuesBuffer;
    if (frequencyData.length % values.length !== 0) {
      throw new Error("frequency data isn't an even mutiple of HEIGHT");
    }

    const binBatchSize = frequencyData.length / values.length;

    values.fill(0);
    frequencyData.forEach((v, i) => {
      const idx = Math.floor(i / binBatchSize);
      values[idx] += (v / binBatchSize / 255);
    });

    let total = 0;
    values.forEach(v => total += v);
    total = total / values.length;

    if (this.ref) {
      this.ref.displayData({
        points: [
          {
            color: Colors.WHITE,
            value: total
          }
        ],
        heatmap: {
          baseColor: Colors.RED,
          values: values
        }
      });
    }
  }
}
