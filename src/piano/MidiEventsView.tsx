import "./MidiEventsView.scss";

import * as React from "react";

import MidiEvent from "./MidiEvent";
import MidiEventListener, { MidiEventEmitter } from "./MidiEventListener";

const MAX_EVENTS = 100;

interface Props {
  className?: string;
  entryClassName?: string;
  midiEventEmitters: MidiEventEmitter[];
}

export default class MidiEventsView
  extends React.Component<Props, {}>
  implements MidiEventListener
{
  private registeredMidiEventEmitters: MidiEventEmitter[] = [];

  public componentWillUnmount() {
    if (super.componentWillUnmount) {
      super.componentWillUnmount();
    }
    this.unregisterMidiEventEmitters();
  }

  public render() {
    this.refreshMidiEventEmitters();
    return (
      <div
        className={"MidiEventsView " + (this.props.className || "")}
        ref={this.setRef}
      />
    );
  }

  public onMidiEvent(event: MidiEvent, emitter: MidiEventEmitter) {
    if (event.suppressDisplay) {
      return;
    }

    const emitterIndex = this.props.midiEventEmitters.findIndex(
      e => e === emitter
    );
    if (emitterIndex === -1) {
      throw new Error("couldn't find emitter");
    }

    // stop showing events for controller
    if (emitterIndex > 0) {
      return;
    }

    const newElement = document.createElement("div");
    newElement.className = [
      "MidiEventsView-entry",
      this.props.entryClassName || "",
      `emitter${emitterIndex}`
    ].join(" ");
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
  };
  private get ref(): HTMLDivElement {
    if (this.unsafeRef === null) {
      throw new Error("ref not set");
    }
    return this.unsafeRef;
  }
  private set ref(newRef: HTMLDivElement) {
    this.unsafeRef = newRef;
  }

  private refreshMidiEventEmitters() {
    if (this.props.midiEventEmitters === this.registeredMidiEventEmitters) {
      return;
    }

    this.unregisterMidiEventEmitters();
    this.props.midiEventEmitters.forEach(e => e.addListener(this));
    this.registeredMidiEventEmitters = this.props.midiEventEmitters;
  }

  private unregisterMidiEventEmitters() {
    this.registeredMidiEventEmitters.forEach(e => e.removeListener(this));
    this.registeredMidiEventEmitters = [];
  }
}
