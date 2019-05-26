import * as React from "react";

import MidiEvent from "./MidiEvent";
import MidiEventListener, { MidiEventEmitter } from "./MidiEventListener";

import "./MidiEventsView.css";

const MAX_EVENTS = 100;

interface Props {
  className?: string;
  entryClassName?: string;
  midiEventEmitter: MidiEventEmitter;
}

export default class MidiEventsView extends React.Component<Props, {}> implements MidiEventListener {
  private registeredMidiEventEmitter: MidiEventEmitter | null = null;

  public componentWillUnmount() {
    if (super.componentWillUnmount) {
      super.componentWillUnmount();
    }
    this.unregisterMidiEventEmitter();
  }

  public render() {
    this.refreshMidiEventEmitter();
    return (
      <div className={"MidiEventsView " + (this.props.className || "")} ref={this.setRef}/>
    );
  }

  public onMidiEvent(event: MidiEvent) {
    if (event.suppressDisplay) {
      return;
    }

    const newElement = document.createElement("div");
    newElement.className = "MidiEventsView-entry " + (this.props.entryClassName || "");
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
