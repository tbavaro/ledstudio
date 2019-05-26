import PianoEvent from "../portable/base/PianoEvent";
import * as PianoHelpers from "../portable/PianoHelpers";

// tslint:disable no-bitwise

// TODO clean up redundancy between this and PianoEvent

function toHex(n: number): string {
  const s = n.toString(16);
  return (s.length === 1 ? "0" : "") + s;
}

function describeStatusByte(n: number): string | null {
  switch (n >> 4) {
    case 0x8: // note off
      return `NOTE_OFF(${n & 0xf})`;

    case 0x9: // note on
    return `NOTE_ON(${n & 0xf})`;

    default:
      return null;
  }
}

export default class MidiEvent {
  public readonly data: number[];
  public readonly isNoteworthy: boolean;
  public readonly pianoEvent: PianoEvent | null;
  private readonly statusDescription: string | null;
  public readonly suppressDisplay: boolean;

  constructor(data: number[] | Uint8Array, suppressDisplay?: true) {
    if (data instanceof Uint8Array) {
      this.data = Array.from(data);
    } else {
      this.data = [...data];
    }
    this.statusDescription = (
      this.data.length === 0
        ? null
        : describeStatusByte(this.data[0])
    );
    this.isNoteworthy = this.statusDescription !== null;
    this.pianoEvent = PianoHelpers.pianoEventFromMidiData(this.data);
    this.suppressDisplay = suppressDisplay || false;
  }

  public toString() {
    let parts: string[];

    if (this.pianoEvent === null) {
      parts = ["raw:", ...this.data.map(toHex)];
      if (this.statusDescription !== null) {
        parts[0] = this.statusDescription;
      }
    } else {
      parts = [PianoHelpers.describePianoEvent(this.pianoEvent)];
    }
    return parts.join(" ");
  }
}
