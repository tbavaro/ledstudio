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

interface TimestampAndMidiEvent {
  timestamp: number;
  event: MidiEvent;
}

export class QueuedMidiEventEmitter extends MidiEventEmitter {
  private pendingEvents: TimestampAndMidiEvent[] = [];
  private nextTimeout: NodeJS.Timeout | null = null;
  private latestTimestamp: number = 0;

  public terminate() {
    if (this.nextTimeout !== null) {
      clearTimeout(this.nextTimeout);
      this.nextTimeout = null;
    }
  }

  public fireLater(event: MidiEvent, timestamp: number) {
    if (timestamp < this.latestTimestamp) {
      throw new Error("got events out of chronological order");
    }
    this.pendingEvents.push({
      timestamp: timestamp,
      event: event
    });
    this.scheduleDequeueIfNeeded();
  }

  private scheduleDequeueIfNeeded() {
    if (this.nextTimeout === null && this.pendingEvents.length > 0) {
      const nextTimestamp = this.pendingEvents[0].timestamp;
      if (nextTimestamp === undefined) {
        // shouldn't happen because the loop above should eat all the undefineds
        throw new Error("this shouldn't happen");
      }

      const now = performance.now();
      const delay = Math.max(0, nextTimestamp - now);
      this.nextTimeout = setTimeout(this.dequeueEvents, delay);
    }
  }

  private dequeueEvents = () => {
    const now = performance.now();

    // show all the events that have happened by now
    while (this.pendingEvents.length > 0) {
      const head = this.pendingEvents[0];
      if (head.timestamp !== undefined && head.timestamp > now) {
        break;
      }
      this.pendingEvents.shift();
      this.fire(head.event);
    }

    this.nextTimeout = null;
    this.scheduleDequeueIfNeeded();
  }

  public reset() {
    this.pendingEvents = [];
    if (this.nextTimeout) {
      clearTimeout(this.nextTimeout);
      this.nextTimeout = null;
    }
    this.latestTimestamp = 0;
  }
}