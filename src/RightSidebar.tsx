import * as React from "react";

import * as AnalogAudio from "./analogAudio/AnalogAudio";

import { MidiEventEmitter } from "./piano/MidiEventListener";
import MidiEventsView from "./piano/MidiEventsView";

import "./RightSidebar.css";

export interface Actions {
  setMidiInput: (newValue: WebMidi.MIDIInput | null) => void;
  setMidiOutput: (newValue: WebMidi.MIDIOutput | null) => void;
  setMidiControllerInput: (newValue: WebMidi.MIDIInput | null) => void;
  setBeatControllerType: (newValue: BeatControllerType) => void;
  setSelectedSceneName: (newValue: string) => void;
  setSelectedVisualizationName: (newValue: string) => void;
  setAnalogInputId: (newValue: string | null) => void;
}

export type BeatControllerType = "manual" | "ableton";

interface Props {
  actions: Actions;
  sceneNames: ReadonlyArray<string>;
  selectedSceneName: string;
  visualizationNames: ReadonlyArray<string>;
  selectedVisualizationName: string;
  midiInputs: WebMidi.MIDIInput[];
  selectedMidiInput: WebMidi.MIDIInput | null;
  selectedMidiControllerInput: WebMidi.MIDIInput | null;
  midiOutputs: WebMidi.MIDIOutput[];
  selectedMidiOutput: WebMidi.MIDIOutput | null;
  midiEventEmitters: MidiEventEmitter[];
  analogInputs: AnalogAudio.InputDeviceInfo[] | undefined;
  selectedAnalogInputId: string | null;
  selectedBeatControllerType: BeatControllerType;
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
          {this.renderAnalogInputDevices()}
          <p/>
          {this.renderMidiInputDevices()}
          {this.renderMidiOutputDevices()}
          <p/>
          {this.renderMidiControllerDevices()}
          {this.renderBeatControllerDevices()}
          <p/>
        </div>
        <MidiEventsView
          className="RightSidebar-midiEventsView"
          entryClassName="RightSidebar-midiEventEntry"
          midiEventEmitters={this.props.midiEventEmitters}
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

  private renderAnalogInputDevices() {
    const { analogInputs } = this.props;

    if (analogInputs === undefined) {
      return "(initializing analog audio...)";
    }

    return (
      <div className="RightSidebar-analogInputDevices">
        <span>Analog audio in: </span>
        <select
          value={this.props.selectedAnalogInputId || ""}
          onChange={this.handleSetAnalogInputId}
        >
          <option value="" children={"<none>"}/>
          {
            analogInputs.map(input => (
              <option
                key={input.id}
                value={input.id}
                children={input.name}
              />
            ))
          }
        </select>
      </div>
    );
  }

  private renderMidiInputDevices() {
    const { selectedMidiInput } = this.props;
    return (
      <div className="RightSidebar-inputDevices">
        <span>MIDI in: </span>
        <select
          value={selectedMidiInput === null ? "" : selectedMidiInput.id}
          onChange={this.handleSetMidiInput}
        >
          <option value="" children={"<none>"}/>
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
      </div>
    );
  }

  private renderMidiOutputDevices() {
    const { selectedMidiOutput } = this.props;
    return (
      <div className="RightSidebar-outputDevices">
        <span>MIDI out: </span>
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


  private renderMidiControllerDevices() {
    const { selectedMidiControllerInput } = this.props;
    return (
      <div className="RightSidebar-midiControllerDevices">
        <span>MIDI ctrl: </span>
        <select
          value={selectedMidiControllerInput === null ? "" : selectedMidiControllerInput.id}
          onChange={this.handleSetMidiControllerInput}
        >
          <option value="" children={"<none>"}/>
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
      </div>
    );
  }

  private renderBeatControllerDevices() {
    const { selectedBeatControllerType } = this.props;

    const options: BeatControllerType[] = [
      "manual",
      "ableton"
    ];

    return (
      <div className="RightSidebar-beatControllerTypes">
        <span>Beat ctrl: </span>
        <select
          value={selectedBeatControllerType}
          onChange={this.handleSetBeatControllerType}
        >
          {
            options.map(opt => (
              <option
                key={opt}
                value={opt}
                children={opt}
              />
            ))
          }
        </select>
      </div>
    );
  }

  private handleSetMidiInput = (event: React.ChangeEvent<any>) => {
    const id = event.target.value as string;
    this.props.actions.setMidiInput(findById(this.props.midiInputs, id) || null);
  }

  private handleSetMidiControllerInput = (event: React.ChangeEvent<any>) => {
    const id = event.target.value as string;
    this.props.actions.setMidiControllerInput(findById(this.props.midiInputs, id) || null);
  }

  private handleSetBeatControllerType = (event: React.ChangeEvent<any>) => {
    const id = event.target.value as BeatControllerType;
    this.props.actions.setBeatControllerType(id);
  }

  private handleSetMidiOutput = (event: React.ChangeEvent<any>) => {
    const id = event.target.value as string;
    this.props.actions.setMidiOutput(findById(this.props.midiOutputs, id) || null);
  }

  private handleSetAnalogInputId = (event: React.ChangeEvent<any>) => {
    const id = event.target.value as string;
    this.props.actions.setAnalogInputId((id === "") ? null : id);
  }

  private handleSetVisualizationName = (event: React.ChangeEvent<any>) => {
    const name = event.target.value as string;
    this.props.actions.setSelectedVisualizationName(name);
  }

  private handleSetSceneName = (event: React.ChangeEvent<any>) => {
    const name = event.target.value as string;
    this.props.actions.setSelectedSceneName(name);
  }
}
