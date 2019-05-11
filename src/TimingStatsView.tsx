import * as React from "react";

import "./TimingStatsView.css";

const UPDATE_FREQ_MILLIS = 1000;
const TARGET_FPS = 60;
const TARGET_MILLIS = 1000 / TARGET_FPS;

interface Props {
  getTimings: () => {
    visualizationMillis: number,
    fadeCandyMillis: number,
    renderMillis: number,
    framesRenderedSinceLastCall: number
  };
}

interface State {
  message: string;
}

export default class TimingStatsView extends React.Component<Props, State> {
  public state: State = { message: "" };

  private lastUpdateTime?: number;
  private updateInterval?: NodeJS.Timeout;

  public componentDidMount() {
    if (super.componentDidMount) {
      super.componentDidMount();
    }

    this.updateInterval = setInterval(this.update, UPDATE_FREQ_MILLIS);
  }

  public componentWillUnmount() {
    if (super.componentWillUnmount) {
      super.componentWillUnmount();
    }

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }
  }

  public render() {
    return (
      <div className="TimingStatsView">
        {this.state.message}
      </div>
    );
  }

  private update = () => {
    const timings = this.props.getTimings();

    const now = performance.now();
    if (this.lastUpdateTime !== undefined) {
      const timeElapsed = now - this.lastUpdateTime;
      const fps = timings.framesRenderedSinceLastCall / timeElapsed * 1000;

      const vLoad = timings.visualizationMillis / TARGET_MILLIS;
      const fLoad = timings.fadeCandyMillis / TARGET_MILLIS;
      const rLoad = timings.renderMillis / TARGET_MILLIS;
      const load = vLoad + fLoad + rLoad;

      this.setState({
        message: [
          `${Math.round(fps)} fps`,
          `v=${Math.round(vLoad * 100)}%`,
          `f=${Math.round(fLoad * 100)}%`,
          `r=${Math.round(rLoad * 100)}%`,
          `t=${Math.round(load * 100)}%`
        ].join(" / ")
      });
    }
    this.lastUpdateTime = now;
  }
}
