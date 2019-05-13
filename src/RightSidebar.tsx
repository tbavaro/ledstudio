import * as React from "react";

import * as PianoVisualizations from "./portable/PianoVisualizations";

import { MidiEventEmitter } from "./MidiEventListener";
import MidiEventsView from "./MidiEventsView";

import "./RightSidebar.css";

export interface Actions {
  playMusic: () => void;
  stopMusic: () => void;
  setSelectedMidiFilename: (newValue: string) => void;
  setMidiInput: (newValue: WebMidi.MIDIInput | null) => void;
  setMidiOutput: (newValue: WebMidi.MIDIOutput | null) => void;
  setSelectedSceneName: (newValue: string) => void;
  setSelectedVisualizationName: (newValue: PianoVisualizations.Name) => void;
}

interface Props {
  actions: Actions;
  sceneNames: ReadonlyArray<string>;
  selectedSceneName: string;
  visualizationNames: ReadonlyArray<PianoVisualizations.Name>;
  selectedVisualizationName: PianoVisualizations.Name;
  midiFilenames: string[];
  selectedMidiFilename: string;
  isMidiFileLoaded: boolean;
  midiInputs: WebMidi.MIDIInput[];
  selectedMidiInput: WebMidi.MIDIInput | null;
  midiOutputs: WebMidi.MIDIOutput[];
  selectedMidiOutput: WebMidi.MIDIOutput | null;
  midiEventEmitter: MidiEventEmitter;
}

function findById<T extends { readonly id: string }>(entries: T[], id: string): T | undefined {
  return entries.find(e => e.id === id);
}

export default class RightSidebar extends React.PureComponent<Props, {}> {
  public render() {
    return (
      <div className="RightSidebar">
        <div className="RightSidebar-optionsGroup">
        {this.renderSceneSelector()}
        {this.renderVisualizationSelector()}
          <p/>
          {this.renderInputDevices()}
          {this.renderOutputDevices()}
          <p/>
        </div>
        <MidiEventsView
          className="RightSidebar-midiEventsView"
          entryClassName="RightSidebar-midiEventEntry"
          midiEventEmitter={this.props.midiEventEmitter}
        />
      </div>
    );
  }

  private renderSceneSelector() {
    return (
      <div className="RightSidebar-scenes">
        <span>Scene: </span>
        <select
          value={this.props.selectedSceneName}
          onChange={this.handleSetSceneName}
        >
          {
            this.props.sceneNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))
          }
        </select>
      </div>
    );
  }

  private renderVisualizationSelector() {
    return (
      <div className="RightSidebar-visualizations">
        <span>Visualization: </span>
        <select
          value={this.props.selectedVisualizationName}
          onChange={this.handleSetVisualizationName}
        >
          {
            this.props.visualizationNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))
          }
        </select>
      </div>
    );
  }

  private renderMidiFileSelector() {
    return (
      <div className="RightSidebar-midiFiles">
        <span> MIDI file: </span>
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

  private renderInputDevices() {
    const { selectedMidiInput } = this.props;
    const showInAppInputUI = (selectedMidiInput === null);
    return (
      <div className="RightSidebar-inputDevices">
        <span>Input device: </span>
        <select
          value={selectedMidiInput === null ? "" : selectedMidiInput.id}
          onChange={this.handleSetMidiInput}
        >
          <option value="" children={"<in-app>"}/>
          {
            this.props.midiInputs.map(input => (
              <option
                key={input.id}
                value={input.id}
                children={input.name}
              />
            ))
          }
        </select>
        {
          showInAppInputUI
            ? (
                <div className="RightSidebar-inAppInputUI">
                  {this.renderMidiFileSelector()}
                  {this.renderMusicControls()}
                </div>
              )
            : null
        }
      </div>
    );
  }

  private renderOutputDevices() {
    const { selectedMidiOutput } = this.props;
    return (
      <div className="RightSidebar-outputDevices">
        <span>Output device: </span>
        <select
          value={selectedMidiOutput === null ? "" : selectedMidiOutput.id}
          onChange={this.handleSetMidiOutput}
        >
          <option value="" children={"<none>"}/>
          {
            this.props.midiOutputs.map(output => (
              <option
                key={output.id}
                value={output.id}
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
    );
  }

  private handleSetMidiInput = (event: React.ChangeEvent<any>) => {
    const id = event.target.value as string;
    this.props.actions.setMidiInput(findById(this.props.midiInputs, id) || null);
  }

  private handleSetMidiOutput = (event: React.ChangeEvent<any>) => {
    const id = event.target.value as string;
    this.props.actions.setMidiOutput(findById(this.props.midiOutputs, id) || null);
  }

  private handleSetMidiFilename = (event: React.ChangeEvent<any>) => {
    const filename = event.target.value as string;
    this.props.actions.setSelectedMidiFilename(filename);
  }

  private handleSetVisualizationName = (event: React.ChangeEvent<any>) => {
    const name = event.target.value as PianoVisualizations.Name;
    this.props.actions.setSelectedVisualizationName(name);
  }

  private handleSetSceneName = (event: React.ChangeEvent<any>) => {
    const name = event.target.value as string;
    this.props.actions.setSelectedSceneName(name);
  }
}
