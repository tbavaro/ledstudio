import PianoEvent, { Key } from "./base/PianoEvent";
import * as PianoVisualization from "./base/PianoVisualization";
import * as Utils from "./Utils";

const MIDI_KEY_OFFSET = -21;
const MIDI_MAX_VELOCITY = 127;

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
          const velocity = data.length >= 3 ? (data[2] / MIDI_MAX_VELOCITY) : 1;
          const isKeyPress = (data[0] === 0x90 && velocity > 0);
          return {
            type: (isKeyPress ? "keyPressed": "keyReleased"),
            key: data[1] + MIDI_KEY_OFFSET,
            velocity: velocity
          };
        }
      }

    default:
      return null;
  }
}

export function resetAllKeysMidiDatas(): number[][] {
  const output: number[][] = [];

  for (let i = 0; i < 88; ++i) {
    const midiKey = i - MIDI_KEY_OFFSET;
    output.push([ 0x80, midiKey, 0 ]);
  }

  return output;
}

export function describePianoEvent(event: PianoEvent): string {
  const parts = Object.keys(event).map(key => {
    const value = event[key];
    switch (key) {
      case "type": return `${value}`;
      case "velocity": return `v=${Utils.floatToString(value, 2)}`;
      default: return `${key[0]}=${JSON.stringify(value)}`;
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
      keyVelocities: new Array<number>(NUM_KEYS).fill(0),
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
        this.applyPressOrReleaseEvent(/*isPress=*/event.type === "keyPressed", event.key, event.velocity);
        break;

      default:
        // unrecognized event; throw?
        break;
    }
  }

  private applyPressOrReleaseEvent(isPress: boolean, key: Key, velocity: number) {
    if (this.state.keys[key] !== isPress) {
      this.state.keys[key] = isPress;
      this.state.keyVelocities[key] = velocity;
      if (!this.state.changedKeys.includes(key)) {
        this.state.changedKeys.push(key);
      }
    }
  }
}
