import * as React from "react";

import BeatController from "./portable/base/BeatController";
import * as Colors from "./portable/base/Colors";

import ManualBeatController from "./beat/ManualBeatController";

import "./BeatControlView.css";

interface Props {
  beatController: BeatController;
}

export default class BeatControlView extends React.Component<Props, {}> {
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

  private onMouseDown = () => {
    if (this.props.beatController instanceof ManualBeatController) {
      this.props.beatController.onTap();
    }
    this.setState({
      bpm: this.props.beatController.hz() * 60
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

    if (this.buttonRef !== null) {
      const beatPhase = this.props.beatController.progressToNextBeat();
      this.buttonRef.style.backgroundColor = Colors.cssColor(Colors.hsv(0, 1, 1 - beatPhase));
    }

    if (this.labelRef !== null) {
      const bpm = this.props.beatController.hz() * 60;
      this.labelRef.innerText = `${Math.round(bpm)}`;
    }

    if (this.label2Ref !== null) {
      const beatNum = (this.props.beatController.beatsSinceSync() % 4) + 1;
      this.label2Ref.innerText = `${beatNum}`;
    }
  }
}
