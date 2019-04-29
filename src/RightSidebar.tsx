import * as React from "react";

import MidiEvent from "./MidiEvent";
import MidiEventListener, { MidiEventEmitter } from "./MidiEventListener";
import MidiEventsView from "./MidiEventsView";

import "./RightSidebar.css";

export interface Actions {
  playMusic: () => void;
  stopMusic: () => void;
  setSelectedMidiFilename: (newValue: string) => void;
  setMidiOutput: (newValue: WebMidi.MIDIOutput | null) => void;
}

interface Props {
  actions: Actions;
  webMidi: WebMidi.MIDIAccess;
  midiFilenames: string[];
  selectedMidiFilename: string;
  isMidiFileLoaded: boolean;
  selectedMidiOutput: WebMidi.MIDIOutput | null;
  midiEventEmitter: MidiEventEmitter;
}

export default class RightSidebar extends React.PureComponent<Props, {}> implements MidiEventListener {
  private registeredEventEmitter: MidiEventEmitter | null;

  public componentWillMount() {
    this.props.midiEventEmitter.addListener(this);
    this.registeredEventEmitter = this.props.midiEventEmitter;
  }

  public componentWillUnmount() {
    this.props.midiEventEmitter.removeListener(this);
  }

  public render() {
    // if this actually happens, detect when it occurs so we can deregister
    // from old emitter and register with the new one
    if (this.registeredEventEmitter !== this.props.midiEventEmitter) {
      throw new Error("changing event emitter not supported");
    }

    return (
      <div className="RightSidebar">
        {this.renderMidiFileSelector()}
        {this.renderOutputDevices()}
        {this.renderMusicControls()}
        <MidiEventsView ref={this.setMidiEventsViewRef}/>
      </div>
    );
  }

  private renderMidiFileSelector() {
    return (
      <div className="RightSidebar-midiFiles">
        <span>MIDI file: </span>
        <select
          value={this.props.selectedMidiFilename}
          onChange={this.handleSetMidiFilename}
        >
          {
            this.props.midiFilenames.map(filename => (
              <option key={filename} value={filename}>{filename}</option>
            ))
          }
        </select>
        {this.props.isMidiFileLoaded ? " (loaded)" : " (not loaded)" }
      </div>
    );
  }

  private renderOutputDevices() {
    const { webMidi, selectedMidiOutput } = this.props;
    const outputs = Array.from(webMidi.outputs.entries());
    return (
      <div className="RightSidebar-outputDevices">
        <span>Output device: </span>
        <select
          value={selectedMidiOutput === null ? "" : selectedMidiOutput.id}
          onChange={this.handleSetMidiOutput}
        >
          <option value="" children={"<none>"}/>
          {
            outputs.map(([key, output]) => (
              <option
                key={key}
                value={key}
                children={output.name}
              />
            ))
          }
        </select>
      </div>
    );
  }

  private renderMusicControls() {
    return (
      <div className="RightSidebar-musicControls">
        <a onClick={this.props.actions.playMusic}>Play</a>
        &nbsp;
        <a onClick={this.props.actions.stopMusic}>Stop</a>
      </div>
    )
  }

  private handleSetMidiOutput = (event: React.ChangeEvent<any>) => {
    const id = event.target.value as string;
    const output = this.props.webMidi.outputs.get(id);
    this.props.actions.setMidiOutput(output || null);
  }

  public onMidiEvent = (event: MidiEvent) => {
    this.midiEventsViewRef.onSend(event);
  }

  private unsafeMidiEventsViewRef: MidiEventsView | null = null;
  private setMidiEventsViewRef = (newRef: MidiEventsView) => this.unsafeMidiEventsViewRef = newRef;
  private get midiEventsViewRef(): MidiEventsView {
    if (this.unsafeMidiEventsViewRef === null) {
      throw new Error("ref not set");
    }
    return this.unsafeMidiEventsViewRef;
  }

  private handleSetMidiFilename = (event: React.ChangeEvent<any>) => {
    const filename = event.target.value as string;
    this.props.actions.setSelectedMidiFilename(filename);
  }
}
