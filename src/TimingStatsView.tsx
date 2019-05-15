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
  message2?: () => string;
}

interface State {
  message: string;
}

export default class TimingStatsView extends React.Component<Props, State> {
  public state: State = { message: "" };

  private lastUpdateTime?: number;
  private updateInterval?: NodeJS.Timeout;

  public componentWillMount() {
    if (super.componentWillMount) {
      super.componentWillMount();
    }

    this.updateInterval = setInterval(this.update, UPDATE_FREQ_MILLIS);
    this.update();
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
    const message2: string = (
      this.props.message2 === undefined
        ? ""
        : this.props.message2()
    );

    return (
      <div className="TimingStatsView">
        {this.state.message}
        {
          message2 === ""
            ? null
            : <div>{message2}</div>
        }
      </div>
    );
  }

  private update = () => {
    const timings = this.props.getTimings();

    const now = performance.now();
    const timeElapsed = this.lastUpdateTime ? (now - this.lastUpdateTime) : 0;
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
    this.lastUpdateTime = now;
  }
}
