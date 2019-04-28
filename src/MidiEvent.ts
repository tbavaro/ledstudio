function toHex(n: number): string {
  const s = n.toString(16);
  return (s.length === 1 ? "0" : "") + s;
}

export default class MidiEvent {
  public readonly data: number[];
  public readonly timestamp: number | undefined;

  constructor(data: number[] | Uint8Array, timestamp?: number) {
    if (data instanceof Uint8Array) {
      this.data = Array.from(data);
    } else {
      this.data = data;
    }
    this.timestamp = timestamp;
  }

  public toString() {
    const parts: string[] = this.data.map(toHex);
    if (this.timestamp !== undefined) {
      parts.unshift(`${Math.floor(this.timestamp) || 0}:`);
    }
    return parts.join(" ");
  }
}