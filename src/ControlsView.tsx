import * as React from "react";

import ControllerState from "./portable/base/ControllerState";

import "./ControlsView.css";

interface Props {
  controllerState: ControllerState;
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
        <div key={`button${i}`} className={`ControlsView-button ${value ? "pressed" : ""}`}>{i + 1}</div>
      ),
      flipped: true
    });
  }

  private renderDials() {
    return this.render4by2({
      values: this.props.controllerState.dialValues,
      renderFunc: (value, i) => (
        <div key={`button${i}`} className="ControlsView-dial">
          <span
            className="ControlsView-dialIndicator"
            style={{
              transform: `translateX(-50%) rotate(${-135 + 270 * value}deg)`
            }}
          />
          <span className="ControlsView-dialLabel">
            {i + 1}
          </span>
        </div>
      ),
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
        {
          (attrs.flipped ? [1, 0] : [0, 1]).map(rowIdx => {
            return (
              <div key={`row${rowIdx}`} className="ControlsView-controlsRow">
                {
                  [0, 1, 2, 3].map(offset => {
                    const n = rowIdx * 4 + offset;
                    return attrs.renderFunc(attrs.values[n], n);
                  })
                }
              </div>
            );
          })
        }
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
}
