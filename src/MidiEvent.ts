// tslint:disable no-bitwise

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
  public readonly timestamp: number | undefined;
  public readonly isNoteworthy: boolean;
  private readonly statusDescription: string | null;

  constructor(data: number[] | Uint8Array, timestamp?: number) {
    if (data instanceof Uint8Array) {
      this.data = Array.from(data);
    } else {
      this.data = data;
    }
    this.statusDescription = (
      this.data.length === 0
        ? null
        : describeStatusByte(this.data[0])
    );
    this.isNoteworthy = this.statusDescription !== null;
    this.timestamp = timestamp;
  }

  public toString() {
    const parts: string[] = this.data.map(toHex);
    if (this.statusDescription !== null) {
      parts[0] = this.statusDescription;
    }
    if (this.timestamp !== undefined) {
      parts.unshift(`${Math.floor(this.timestamp) || 0}:`);
    }
    return parts.join(" ");
  }
}
