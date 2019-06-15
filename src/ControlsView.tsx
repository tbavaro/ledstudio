import * as React from "react";

import MidiEvent from "./piano/MidiEvent";
import MidiEventListener, { MidiEventEmitter } from "./piano/MidiEventListener";

import "./ControlsView.css";

interface Props {
  midiEventEmitter: MidiEventEmitter;
}

export default class ControlsView extends React.PureComponent<Props, {}> implements MidiEventListener {
  private registeredMidiEventEmitter: MidiEventEmitter | null = null;

  public componentWillUnmount() {
    if (super.componentWillUnmount) {
      super.componentWillUnmount();
    }
    this.unregisterMidiEventEmitter();
  }

  public render() {
    this.refreshMidiEventEmitter();

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
    const values = [ true, false, false, true, true, true, false, false ];
    return this.render4by2({
      values,
      renderFunc: (value, i) => (
        <div key={`button${i}`} className={`ControlsView-button ${value ? "pressed" : ""}`}>{i + 1}</div>
      ),
      flipped: true
    });
  }

  private renderDials() {
    const values = [ 0.5, 0, 0.2, 0.8, 1.0, 0.7, 0.4, 0 ];
    return this.render4by2({
      values,
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

  public onMidiEvent(event: MidiEvent) {
    const pianoEvent = event.pianoEvent;
    if (pianoEvent !== null) {
      switch (pianoEvent.type) {
        case "keyPressed":
          // this.setKeyPressed(pianoEvent.key, /*isPressed=*/true);
          break;

        case "keyReleased":
          // this.setKeyPressed(pianoEvent.key, /*isPressed=*/false);
          break;

        default:
          break;
      }
    }
  }

  private refreshMidiEventEmitter() {
    if (this.props.midiEventEmitter === this.registeredMidiEventEmitter) {
      return;
    }

    this.unregisterMidiEventEmitter();
    this.props.midiEventEmitter.addListener(this);
    this.registeredMidiEventEmitter = this.props.midiEventEmitter;
  }

  private unregisterMidiEventEmitter() {
    if (this.registeredMidiEventEmitter !== null) {
      this.registeredMidiEventEmitter.removeListener(this);
      this.registeredMidiEventEmitter = null;
    }
  }
}
