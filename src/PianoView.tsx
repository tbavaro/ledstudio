import * as React from "react";

import MidiEvent from "./piano/MidiEvent";
import MidiEventListener, { MidiEventEmitter } from "./piano/MidiEventListener";
import styles from "./PianoView.module.scss";
import { cm } from "./util/CSSUtils";
import { fillArray } from "./util/Utils";

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

interface KeyProps {
  offset: number;
  isBlack: boolean;
}

interface KeyState {
  isPressed: boolean;
}

class PianoKey extends React.PureComponent<KeyProps, KeyState> {
  public state: KeyState = { isPressed: false };

  public render() {
    const { isBlack, offset } = this.props;
    const { isPressed } = this.state;
    return (
      <div
        className={cm(styles, isBlack ? "blackKey" : "whiteKey", {
          pressed: isPressed
        })}
        style={{
          width: isBlack ? BLACK_KEY_WIDTH_PCT_STR : WHITE_KEY_WIDTH_PCT_STR,
          left: isBlack
            ? `${
                (offset + 1) * WHITE_KEY_WIDTH_PCT - 0.5 * BLACK_KEY_WIDTH_PCT
              }%`
            : `${offset * WHITE_KEY_WIDTH_PCT}%`
        }}
      />
    );
  }

  public setIsPressed(isPressed: boolean) {
    this.setState({ isPressed });
  }
}

interface Props {
  midiEventEmitter: MidiEventEmitter;
}

export default class PianoView
  extends React.PureComponent<Props>
  implements MidiEventListener
{
  private registeredMidiEventEmitter: MidiEventEmitter | null = null;

  private readonly keyRefs = fillArray(NUM_KEYS, () =>
    React.createRef<PianoKey>()
  );

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
        <PianoKey
          key={n}
          offset={offset}
          isBlack={isBlack}
          ref={this.keyRefs[n]}
        />
      );
    }

    return (
      <div className={styles.root}>
        <div className={styles.piano}>
          {whiteKeys}
          {blackKeys}
        </div>
      </div>
    );
  }

  public componentWillUnmount() {
    this.unregisterMidiEventEmitter();
    super.componentWillUnmount?.();
  }

  private setKeyPressed(n: number, isPressed: boolean) {
    if (n < 0 || n >= NUM_KEYS) {
      console.log("got out-of-range note", n);
      return;
    }

    const ref = this.keyRefs[n];
    ref.current?.setIsPressed(isPressed);
  }

  public reset() {
    this.keyRefs.forEach(ref => ref.current?.setIsPressed(false));
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
