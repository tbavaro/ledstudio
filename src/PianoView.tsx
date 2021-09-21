import "./PianoView.scss";

import * as React from "react";

import MidiEvent from "./piano/MidiEvent";
import MidiEventListener, { MidiEventEmitter } from "./piano/MidiEventListener";

const NUM_KEYS = 88;

function isBlackKey(n: number): boolean {
  switch (n % 12) {
    case 1:
    case 4:
    case 6:
    case 9:
    case 11:
      return true;

    default:
      return false;
  }
}

const NUM_WHITE_KEYS = (() => {
  let n = 0;
  for (let i = 0; i < NUM_KEYS; ++i) {
    if (!isBlackKey(i)) {
      n++;
    }
  }
  return n;
})();

const WHITE_KEY_WIDTH_PCT = 100 / NUM_WHITE_KEYS;
const WHITE_KEY_WIDTH_PCT_STR = `${WHITE_KEY_WIDTH_PCT}%`;
const BLACK_KEY_WIDTH_PCT = WHITE_KEY_WIDTH_PCT * 0.6;
const BLACK_KEY_WIDTH_PCT_STR = `${BLACK_KEY_WIDTH_PCT}%`;

interface State {
  keyState: boolean[];
}

function defaultKeyState(): boolean[] {
  const arr: boolean[] = [];
  arr.fill(false, 0, NUM_KEYS);
  return arr;
}

interface Props {
  midiEventEmitter: MidiEventEmitter;
}

export default class PianoView
  extends React.PureComponent<Props, State>
  implements MidiEventListener
{
  public state: State = {
    keyState: defaultKeyState()
  };

  private registeredMidiEventEmitter: MidiEventEmitter | null = null;

  public componentWillUnmount() {
    if (super.componentWillUnmount) {
      super.componentWillUnmount();
    }
    this.unregisterMidiEventEmitter();
  }

  public render() {
    this.refreshMidiEventEmitter();
    // console.log("rendering piano");
    const whiteKeys: JSX.Element[] = [];
    const blackKeys: JSX.Element[] = [];
    let offset = -1;
    for (let n = 0; n < NUM_KEYS; ++n) {
      const isBlack = isBlackKey(n);
      if (!isBlack) {
        offset++;
      }
      (isBlack ? blackKeys : whiteKeys).push(
        this.renderKey(n, offset, isBlack, this.state.keyState[n])
      );
    }

    return (
      <div className="PianoView">
        <div className="PianoView-piano">
          {whiteKeys}
          {blackKeys}
        </div>
      </div>
    );
  }

  private renderKey(
    n: number,
    offset: number,
    isBlack: boolean,
    isPressed: boolean
  ) {
    return (
      <div
        key={n}
        className={
          (isBlack ? "PianoView-blackKey" : "PianoView-whiteKey") +
          (isPressed ? " pressed" : "")
        }
        style={{
          width: isBlack ? BLACK_KEY_WIDTH_PCT_STR : WHITE_KEY_WIDTH_PCT_STR,
          left: isBlack
            ? `${
                (offset + 1) * WHITE_KEY_WIDTH_PCT - 0.5 * BLACK_KEY_WIDTH_PCT
              }%`
            : `${offset * WHITE_KEY_WIDTH_PCT}%`
        }}
        ref={this.setKeyRefs[n]}
      />
    );
  }

  private keyRefs: HTMLDivElement[] = [];
  private setKeyRefs = (() => {
    const funcs: Array<(newRef: HTMLDivElement) => void> = [];
    for (let n = 0; n < NUM_KEYS; ++n) {
      funcs.push((newRef: HTMLDivElement) => {
        this.keyRefs[n] = newRef;
      });
    }
    return funcs;
  })();

  private setKeyPressed(n: number, isPressed: boolean) {
    if (n < 0 || n >= NUM_KEYS) {
      console.log("got out-of-range note", n);
      return;
    }

    const { keyState } = this.state;
    keyState[n] = isPressed;
    const keyRef = this.keyRefs[n];
    const classNames = keyRef.className.split(" ").filter(x => x !== "pressed");
    if (isPressed) {
      classNames.push("pressed");
    }
    keyRef.className = classNames.join(" ");
  }

  public reset() {
    this.setState({
      keyState: defaultKeyState()
    });
    this.forceUpdate();
  }

  public onMidiEvent(event: MidiEvent) {
    const pianoEvent = event.pianoEvent;
    if (pianoEvent !== null) {
      switch (pianoEvent.type) {
        case "keyPressed":
          this.setKeyPressed(pianoEvent.key, /*isPressed=*/ true);
          break;

        case "keyReleased":
          this.setKeyPressed(pianoEvent.key, /*isPressed=*/ false);
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
