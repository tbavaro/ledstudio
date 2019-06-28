import * as React from "react";

import * as Colors from "./portable/base/Colors";

import ManualBeatController from "./portable/visualizations/util/ManualBeatController";

import "./BeatControlView.css";

export default class BeatControlView extends React.Component<{}, {}> {
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
        className="BeatControlView-button"
        onMouseDown={this.onMouseDown}
        ref={this.setButtonRef}
      >
        <div className="BeatControlView-buttonLabel" ref={this.setLabelRef}/>
        <div className="BeatControlView-buttonLabel2" ref={this.setLabel2Ref}/>
      </div>
    );
  }

  private beatController = new ManualBeatController();

  private onMouseDown = () => {
    if (this.beatController.onTap) {
      this.beatController.onTap();
    }
    this.setState({
      bpm: this.beatController.hz() * 60
    });
  }

  private buttonRef: HTMLDivElement | null = null;
  private setButtonRef = (newRef: HTMLDivElement | null) => {
    const first = (this.buttonRef === null && newRef !== null);
    this.buttonRef = newRef;
    if (first) {
      this.animate();
    }
  }

  private labelRef: HTMLDivElement | null = null;
  private setLabelRef = (newRef: HTMLDivElement | null) => {
    this.labelRef = newRef;
  }

  private label2Ref: HTMLDivElement | null = null;
  private setLabel2Ref = (newRef: HTMLDivElement | null) => {
    this.label2Ref = newRef;
  }

  private isAlive = true;
  private animate = () => {
    if (this.isAlive) {
      requestAnimationFrame(this.animate);
    }

    const beatPhase = this.beatController.progressToNextBeat();
    if (this.buttonRef !== null) {
      this.buttonRef.style.backgroundColor = Colors.cssColor(Colors.hsv(0, 1, 1 - beatPhase));
    }

    if (this.labelRef !== null) {
      const bpm = this.beatController.hz() * 60;
      this.labelRef.innerText = `${Math.round(bpm)}`;
    }

    if (this.label2Ref !== null) {
      const beatNum = (this.beatController.beatsSinceSync() % 4) + 1;
      this.label2Ref.innerText = `${beatNum}`;
    }
  }
}
