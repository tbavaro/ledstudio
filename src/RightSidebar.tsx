import * as React from "react";

import * as AudioIn from "./audioIn/AudioIn";

import { MidiEventEmitter } from "./piano/MidiEventListener";
import MidiEventsView from "./piano/MidiEventsView";

import "./RightSidebar.css";

export interface Actions {
  setPianoMidiInput: (newValue: WebMidi.MIDIInput | null) => void;
  setPianoMidiThru: (newValue: WebMidi.MIDIOutput | null) => void;
  setControllerMidiInput: (newValue: WebMidi.MIDIInput | null) => void;
  setBeatControllerType: (newValue: BeatControllerType) => void;
  setSelectedSceneName: (newValue: string) => void;
  setSelectedVisualizationName: (newValue: string) => void;
  setAudioInputId: (newValue: string | null) => void;
}

export type BeatControllerType = "manual" | "ableton";

interface Props {
  actions: Actions;
  sceneNames: ReadonlyArray<string>;
  selectedSceneName: string;
  visualizationNames: ReadonlyArray<string>;
  selectedVisualizationName: string;
  midiInputs: WebMidi.MIDIInput[];
  selectedPianoMidiInput: WebMidi.MIDIInput | null;
  selectedControllerMidiInput: WebMidi.MIDIInput | null;
  midiOutputs: WebMidi.MIDIOutput[];
  selectedPianoMidiThru: WebMidi.MIDIOutput | null;
  midiEventEmitters: MidiEventEmitter[];
  audioInputs: AudioIn.InputDeviceInfo[] | undefined;
  selectedAudioInputId: string | null;
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
          {this.renderAudioInputDevices()}
          {this.renderPianoMidiInputDevices()}
          {this.renderPianoMidiThruDevices()}
          {this.renderControllerMidiDevices()}
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

  private renderAudioInputDevices() {
    const { audioInputs } = this.props;

    if (audioInputs === undefined) {
      return "(initializing audio in...)";
    }

    return (
      <div className="RightSidebar-audioInputDevices">
        <span>Audio in: </span>
        <select
          value={this.props.selectedAudioInputId || ""}
          onChange={this.handleSetAudioInputId}
        >
          <option value="" children={"<none>"}/>
          {
            audioInputs.map(input => (
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

  private renderPianoMidiInputDevices() {
    const { selectedPianoMidiInput } = this.props;
    return (
      <div className="RightSidebar-inputDevices">
        <span>Piano MIDI in: </span>
        <select
          value={selectedPianoMidiInput === null ? "" : selectedPianoMidiInput.id}
          onChange={this.handleSetPianoMidiInput}
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

  private renderPianoMidiThruDevices() {
    const { selectedPianoMidiThru } = this.props;
    return (
      <div className="RightSidebar-outputDevices">
        <span>Piano MIDI thru: </span>
        <select
          value={selectedPianoMidiThru === null ? "" : selectedPianoMidiThru.id}
          onChange={this.handleSetPianoMidiThru}
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


  private renderControllerMidiDevices() {
    const { selectedControllerMidiInput } = this.props;
    return (
      <div className="RightSidebar-midiControllerDevices">
        <span>Ctrl MIDI in: </span>
        <select
          value={selectedControllerMidiInput === null ? "" : selectedControllerMidiInput.id}
          onChange={this.handleSetControllerMidiInput}
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

  private handleSetPianoMidiInput = (event: React.ChangeEvent<any>) => {
    const id = event.target.value as string;
    this.props.actions.setPianoMidiInput(findById(this.props.midiInputs, id) || null);
  }

  private handleSetControllerMidiInput = (event: React.ChangeEvent<any>) => {
    const id = event.target.value as string;
    this.props.actions.setControllerMidiInput(findById(this.props.midiInputs, id) || null);
  }

  private handleSetBeatControllerType = (event: React.ChangeEvent<any>) => {
    const id = event.target.value as BeatControllerType;
    this.props.actions.setBeatControllerType(id);
  }

  private handleSetPianoMidiThru = (event: React.ChangeEvent<any>) => {
    const id = event.target.value as string;
    this.props.actions.setPianoMidiThru(findById(this.props.midiOutputs, id) || null);
  }

  private handleSetAudioInputId = (event: React.ChangeEvent<any>) => {
    const id = event.target.value as string;
    this.props.actions.setAudioInputId((id === "") ? null : id);
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
