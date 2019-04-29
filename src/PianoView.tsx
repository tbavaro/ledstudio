import * as React from "react";

import "./PianoView.css";

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

const MIDI_KEY_OFFSET = -21;

const WHITE_KEY_WIDTH_PCT = 100 / NUM_WHITE_KEYS;
const WHITE_KEY_WIDTH_PCT_STR = `${WHITE_KEY_WIDTH_PCT}%`;
const BLACK_KEY_WIDTH_PCT = WHITE_KEY_WIDTH_PCT * 0.6;
const BLACK_KEY_WIDTH_PCT_STR = `${BLACK_KEY_WIDTH_PCT}%`;

interface State {
  keyState: boolean[];
};

function defaultKeyState(): boolean[] {
  const arr: boolean[] = [];
  arr.fill(false, 0, NUM_KEYS);
  return arr;
}

export default class PianoView extends React.PureComponent<{}, State> {
  public state: State = {
    keyState: defaultKeyState()
  };

  public render() {
    console.log("rendering piano");
    const whiteKeys: JSX.Element[] = [];
    const blackKeys: JSX.Element[] = [];
    let offset = -1;
    for (let n = 0; n < NUM_KEYS; ++n) {
      const isBlack = isBlackKey(n);
      if (!isBlack) {
        offset++;
      }
      (isBlack ? blackKeys : whiteKeys).push(this.renderKey(n, offset, isBlack, this.state.keyState[n]));
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

  private renderKey(n: number, offset: number, isBlack: boolean, isPressed: boolean) {
    return (
      <div
        key={n}
        className={ (isBlack ? "PianoView-blackKey" : "PianoView-whiteKey") + (isPressed ? " pressed" : "") }
        style={{
          width: isBlack ? BLACK_KEY_WIDTH_PCT_STR : WHITE_KEY_WIDTH_PCT_STR,
          left: (
            isBlack
              ? `${(offset + 1) * WHITE_KEY_WIDTH_PCT - 0.5 * BLACK_KEY_WIDTH_PCT}%`
              : `${offset * WHITE_KEY_WIDTH_PCT}%`
          )
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

  public setKeyPressed(midiKeyNumber: number, isPressed: boolean) {
    const n = midiKeyNumber + MIDI_KEY_OFFSET;
    if (n < 0 || n >= NUM_KEYS) {
      console.log("got out-of-range note", midiKeyNumber);
      return;
    }

    this.state.keyState[n] = isPressed;
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
}
