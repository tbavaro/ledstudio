import * as React from "react";

import "./MidiEventsView.css";

const MAX_EVENTS = 100;
let nextId = 0;

export default class MidiEventsView extends React.Component<{}, {}> {
  private interval: NodeJS.Timeout | null = null;

  public componentDidMount() {
    this.interval = setInterval(this.onTick, 30);
  }

  public componentWillUnmount() {
    if (this.interval !== null) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  public render() {
    return (
      <div className="MidiEventsView" ref={this.setRef}/>
    );
  }

  public addEvent(event: string) {
    const newElement = document.createElement("div");
    newElement.className = "MidiEventsView-entry";
    newElement.innerText = event;

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

  private onTick = () => {
    this.addEvent(`event ${(nextId++)}: ${new Date().toString()}`);
  }
}
