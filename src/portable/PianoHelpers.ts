import PianoEvent, { Key } from "./base/PianoEvent";
import * as PianoVisualization from "./base/PianoVisualization";

const MIDI_KEY_OFFSET = -21;

export function pianoEventFromMidiData(data: number[]): PianoEvent | null {
  if (data.length < 1) {
    return null;
  }

  switch (data[0]) {
    case 0x80:
    case 0x90:
      if (data.length < 2) {
        return null;
      } else {
        const key = data[1] + MIDI_KEY_OFFSET;
        if (key < 0 || key >= NUM_KEYS) {
          return null;
        } else {
          return {
            type: (data[0] === 0x80 ? "keyReleased" : "keyPressed"),
            key: data[1] + MIDI_KEY_OFFSET,
            velocity: data.length >= 3 ? data[2] : 0
          };
        }
      }

    default:
      return null;
  }
}

export function describePianoEvent(event: PianoEvent): string {
  const parts = Object.keys(event).map(key => {
    const value = event[key];
    if (key === "type") {
      return `${value}`;
    } else {
      return `${key[0]}=${JSON.stringify(value)}`;
    }
  });

  return parts.join(" ");
}

const NUM_KEYS = 88;

type AccessibleState = {
  -readonly [k in keyof PianoVisualization.State]: PianoVisualization.State[k] extends ReadonlyArray<infer T> ? T[] : string
};

export class PianoVisualizationStateHelper {
  private state: AccessibleState;

  constructor() {
    this.state = PianoVisualizationStateHelper.freshState();
  }

  public reset() {
    this.state = PianoVisualizationStateHelper.freshState();
  }

  private static freshState(): AccessibleState {
    return {
      keys: new Array<boolean>(NUM_KEYS).fill(false),
      changedKeys: []
    };
  }

  public startFrame() {
    this.state.changedKeys = [];
  }

  public endFrame(): PianoVisualization.State {
    this.state.changedKeys.sort();
    return this.state;
  }

  public applyEvent(event: PianoEvent) {
    switch (event.type) {
      case "keyPressed":
      case "keyReleased":
        this.applyPressOrReleaseEvent(event.type === "keyPressed", event.key);
        break;

      default:
        // unrecognized event; throw?
        break;
    }
  };

  private applyPressOrReleaseEvent(isPress: boolean, key: Key) {
    if (this.state.keys[key] !== isPress) {
      this.state.keys[key] = isPress;
      if (!this.state.changedKeys.includes(key)) {
        this.state.changedKeys.push(key);
      }
    }
  }
}
