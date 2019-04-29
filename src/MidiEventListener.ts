import MidiEvent from "./MidiEvent";

export default interface MidiEventListener {
  onMidiEvent: (event: MidiEvent) => void;
}

export class MidiEventEmitter {
  private listeners: MidiEventListener[] = [];

  public addListener(listener: MidiEventListener) {
    if (!this.listeners.includes(listener)) {
      this.listeners.push(listener);
    }
  }

  public removeListener(listener: MidiEventListener) {
    this.listeners = this.listeners.filter(x => x !== listener);
  }

  public fire(event: MidiEvent) {
    this.listeners.forEach(listener => listener.onMidiEvent(event));
  }
}