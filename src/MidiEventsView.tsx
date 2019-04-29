import * as React from "react";

import MidiEvent from "./MidiEvent";

import "./MidiEventsView.css";

const MAX_EVENTS = 100;

export default class MidiEventsView extends React.Component<{}, {}> {
  private pendingEvents: MidiEvent[] = [];
  private latestTimestamp = 0;
  private nextTimeout: NodeJS.Timeout | null = null;

  public componentWillUnmount() {
    if (super.componentWillUnmount) {
      super.componentWillUnmount();
    }
    if (this.nextTimeout !== null) {
      clearTimeout(this.nextTimeout);
      this.nextTimeout = null;
    }
  }

  public render() {
    return (
      <div className="MidiEventsView" ref={this.setRef}/>
    );
  }

  public onSend(event: MidiEvent) {
    const timestamp = event.timestamp || this.latestTimestamp;
    if (timestamp < this.latestTimestamp) {
      throw new Error("got events out of chronological order");
    }
    this.pendingEvents.push(event);
    this.scheduleDequeueIfNeeded();
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
      this.showEvent(head);
    }

    this.nextTimeout = null;
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

  private showEvent(event: MidiEvent) {
    if (!event.isNoteworthy) {
      return;
    }

    const newElement = document.createElement("div");
    newElement.className = "MidiEventsView-entry";
    newElement.innerText = event.toString();

    const parent = this.ref;
    parent.insertBefore(newElement, parent.firstChild);
    while (parent.children.length > MAX_EVENTS && parent.lastChild) {
      parent.removeChild(parent.lastChild);
    }
  }

  private unsafeRef: HTMLDivElement | null = null;
  private setRef = (newRef: HTMLDivElement) => {
    this.ref = newRef;
  }
  private get ref(): HTMLDivElement {
    if (this.unsafeRef === null) {
      throw new Error("ref not set");
    }
    return this.unsafeRef;
  }
  private set ref(newRef: HTMLDivElement) {
    this.unsafeRef = newRef;
  }
}
