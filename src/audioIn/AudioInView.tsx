import * as Colors from "../portable/base/Colors";

import * as React from "react";

import * as TimeseriesData from "../portable/base/TimeseriesData";

import TimeseriesView from "../simulator/TimeseriesView";

const HEIGHT = 64;

export default class AudioInView extends React.PureComponent<{}, {}> {
  private ref?: TimeseriesView;

  public render() {
    return (
      <TimeseriesView
        height={HEIGHT}
        ref={this.setRef}
      />
    );
  }

  private setRef = (newRef: TimeseriesView) => this.ref = newRef;

  public displayFrequencyData(heatmapValues: number[], points?: TimeseriesData.PointDef[]) {
    if (this.ref) {
      this.ref.displayData(points || [], {
        baseColor: Colors.RED,
        values: heatmapValues
      });
    }
  }
}
