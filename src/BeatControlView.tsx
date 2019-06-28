import * as React from "react";

import * as Colors from "./portable/base/Colors";

import "./BeatControlView.css";

interface State {
  buttonValue: boolean;
  bpm: number;
}

export default class BeatControlView extends React.Component<{}, State> {
  public state: State = {
    buttonValue: false,
    bpm: 120
  };

  public componentWillUnmont() {
    if (super.componentWillUnmount) {
      super.componentWillUnmount();
    }
    this.isAlive = false;
  }

  public render() {
    return (
      <div className="BeatControlView">
        {this.renderButton()}
      </div>
    );
  }

  private renderButton() {
    return (
      <div
        className={`BeatControlView-button ${this.state.buttonValue ? "pressed" : ""}`}
        onMouseDown={this.onMouseDown}
        ref={this.setButtonRef}
      >
        <div className="BeatControlView-buttonLabel">{Math.round(this.state.bpm)}</div>
      </div>
    );
  }

  private isAlive = true;
  private beatStartTime: number = performance.now();
  private beatLengthMillis: number = 60000 / this.state.bpm;
  private prevPressTime: number | null = null;
  private onMouseDown = () => {
    const now = performance.now();
    if (this.prevPressTime !== null && now - this.prevPressTime < 1500) {
      this.beatLengthMillis = now - this.prevPressTime;
      this.setState({
        bpm: 60000 / this.beatLengthMillis
      });
    }
    this.beatStartTime = now;
    this.prevPressTime = now;
  }

  private buttonRef: HTMLDivElement | null = null;
  private setButtonRef = (newRef: HTMLDivElement | null) => {
    const first = (this.buttonRef === null && newRef !== null);
    this.buttonRef = newRef;
    if (first) {
      this.animate();
    }
  }

  private animate = () => {
    if (this.isAlive) {
      requestAnimationFrame(this.animate);
    }
    const now = performance.now();
    const beatPhase = ((now - this.beatStartTime) % this.beatLengthMillis) / this.beatLengthMillis;
    if (this.buttonRef !== null) {
      this.buttonRef.style.backgroundColor = Colors.cssColor(Colors.hsv(0, 1, 1 - beatPhase));
    }
  }
}
