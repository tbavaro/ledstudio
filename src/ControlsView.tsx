import "./ControlsView.scss";

import * as React from "react";

import ControllerState from "./portable/base/ControllerState";
import { bracket01 } from "./util/Utils";

interface Props {
  controllerState: ControllerState;
}

interface MyButtonProps {
  index: number;
  value: boolean;
  setButtonValue: (index: number, value: boolean) => void;
}

class MyButton extends React.PureComponent<MyButtonProps, {}> {
  public componentWillUnmount() {
    if (super.componentWillUnmount) {
      super.componentWillUnmount();
    }
    this.removeListeners();
  }

  public render() {
    return (
      <div
        className={`ControlsView-button ${this.props.value ? "pressed" : ""}`}
        onMouseDown={this.onMouseDown}
      >
        {this.props.index + 1}
      </div>
    );
  }

  private onMouseDown = () => {
    this.props.setButtonValue(this.props.index, true);
    document.addEventListener("mouseup", this.onMouseUp);
  };

  private onMouseUp = () => {
    this.props.setButtonValue(this.props.index, false);
    this.removeListeners();
  };

  private removeListeners = () => {
    document.removeEventListener("mouseup", this.onMouseUp);
  };
}

interface MyDialProps {
  index: number;
  value: number;
  setDialValue: (index: number, value: number) => void;
}

interface MyDialState {
  isDragging: boolean;
}

class MyDial extends React.PureComponent<MyDialProps, MyDialState> {
  public state: MyDialState = { isDragging: false };

  private startDragValue = 0;
  private startDragX = 0;

  public componentWillUnmount() {
    if (super.componentWillUnmount) {
      super.componentWillUnmount();
    }
    this.removeListeners();
  }

  public render() {
    return (
      <div
        className={[
          "ControlsView-dial",
          this.state.isDragging ? "dragging" : ""
        ].join(" ")}
        onMouseDown={this.onMouseDown}
      >
        <span
          className="ControlsView-dialIndicator"
          style={{
            transform: `translateX(-50%) rotate(${
              -135 + 270 * this.props.value
            }deg)`
          }}
        />
        <span className="ControlsView-dialLabel">{this.props.index + 1}</span>
      </div>
    );
  }

  private onMouseDown = (event: React.MouseEvent<any>) => {
    this.startDragValue = this.props.value;
    this.startDragX = event.pageX;
    this.setState({ isDragging: true });
    document.addEventListener("mousemove", this.onMouseMove as any);
    document.addEventListener("mouseup", this.onMouseUp);
  };

  private onMouseUp = () => {
    this.setState({ isDragging: false });
    this.removeListeners();
  };

  private onMouseMove = (event: React.MouseEvent<any>) => {
    this.props.setDialValue(
      this.props.index,
      bracket01(this.startDragValue + (event.pageX - this.startDragX) / 100)
    );
  };

  private removeListeners = () => {
    document.removeEventListener("mousemove", this.onMouseMove as any);
    document.removeEventListener("mouseup", this.onMouseUp);
  };
}

export default class ControlsView extends React.Component<Props, {}> {
  public render() {
    return (
      <div className="ControlsView">
        <div className="ControlsView-controls">
          {this.renderButtons()}
          {this.renderDials()}
        </div>
      </div>
    );
  }

  private renderButtons() {
    return this.render4by2({
      values: this.props.controllerState.buttonStates,
      renderFunc: (value, i) => (
        <MyButton
          key={`button${i}`}
          index={i}
          value={value}
          setButtonValue={this.setButtonValue}
        />
      ),
      flipped: true
    });
  }

  private renderDials() {
    return this.render4by2({
      values: this.props.controllerState.dialValues,
      renderFunc: (value, i) => (
        <MyDial
          key={`dial${i}`}
          index={i}
          value={value}
          setDialValue={this.setDialValue}
        />
      )
    });
  }

  private render4by2<T>(attrs: {
    className?: string;
    values: T[];
    renderFunc: (value: T, idx: number) => any;
    flipped?: boolean;
  }) {
    if (attrs.values.length !== 8) {
      throw new Error("expected 8 values");
    }

    return (
      <div className={`ControlsView-controlsCluster ${attrs.className || ""}`}>
        {(attrs.flipped ? [1, 0] : [0, 1]).map(rowIdx => {
          return (
            <div key={`row${rowIdx}`} className="ControlsView-controlsRow">
              {[0, 1, 2, 3].map(offset => {
                const n = rowIdx * 4 + offset;
                return attrs.renderFunc(attrs.values[n], n);
              })}
            </div>
          );
        })}
      </div>
    );
  }

  private stateChangeTimeout: NodeJS.Timeout | null = null;

  public onStateChange() {
    if (this.stateChangeTimeout === null) {
      this.stateChangeTimeout = setTimeout(() => {
        this.stateChangeTimeout = null;
        this.forceUpdate();
      }, 1000 / 60);
    }
  }

  private setButtonValue = (index: number, value: boolean) => {
    this.props.controllerState.setButtonState(index, value);
    this.forceUpdate();
  };

  private setDialValue = (index: number, value: number) => {
    this.props.controllerState.dialValues[index] = value;
    this.forceUpdate();
  };
}
