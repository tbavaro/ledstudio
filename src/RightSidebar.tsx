import * as React from "react";

import * as AudioIn from "./audioIn/AudioIn";

import { MidiEventEmitter } from "./piano/MidiEventListener";
import MidiEventsView from "./piano/MidiEventsView";

import { identity, valueOrDefault } from "./util/Utils";

import "./RightSidebar.css";

export interface Actions {
  setPianoMidiInput: (newValue: WebMidi.MIDIInput | null) => void;
  setPianoMidiThru: (newValue: WebMidi.MIDIOutput | null) => void;
  setControllerMidiInput: (newValue: WebMidi.MIDIInput | null) => void;
  setBeatControllerType: (newValue: BeatControllerType) => void;
  setSelectedSceneName: (newValue: string) => void;
  setSelectedVisualizationGroupName: (newValue: string) => void;
  setSelectedVisualizationName: (newValue: string) => void;
  setAudioInput: (newValue: AudioIn.InputDeviceInfo | null) => void;
}

export type BeatControllerType = "manual" | "ableton";

interface Props {
  actions: Actions;
  sceneNames: ReadonlyArray<string>;
  selectedSceneName: string;
  visualizationGroupNames: ReadonlyArray<string>;
  selectedVisualizationGroupName: string;
  visualizationNames: ReadonlyArray<string>;
  selectedVisualizationName: string;
  midiInputs: WebMidi.MIDIInput[];
  selectedPianoMidiInput: WebMidi.MIDIInput | null;
  selectedControllerMidiInput: WebMidi.MIDIInput | null;
  midiOutputs: WebMidi.MIDIOutput[];
  selectedPianoMidiThru: WebMidi.MIDIOutput | null;
  midiEventEmitters: MidiEventEmitter[];
  audioInputs: AudioIn.InputDeviceInfo[] | undefined;
  selectedAudioInput: AudioIn.InputDeviceInfo | null;
  selectedBeatControllerType: BeatControllerType;
}

export default class RightSidebar extends React.PureComponent<Props, {}> {
  public render() {
    return (
      <div className="RightSidebar">
        <div className="RightSidebar-optionsGroup">
          {this.renderSceneSelector()}
          <p />
          {this.renderVisualizationGroupSelector()}
          {this.renderVisualizationSelector()}
          <p />
          {this.renderAudioInputDevices()}
          {this.renderPianoMidiInputDevices()}
          {this.renderPianoMidiThruDevices()}
          {this.renderControllerMidiDevices()}
          {this.renderBeatControllerDevices()}
          <p />
        </div>
        <MidiEventsView
          className="RightSidebar-midiEventsView"
          entryClassName="RightSidebar-midiEventEntry"
          midiEventEmitters={this.props.midiEventEmitters}
        />
        <div className="RightSidebar-appVersion">
          v{process.env.REACT_APP_VERSION}
        </div>
      </div>
    );
  }

  private renderSceneSelector() {
    return this.renderDropDownOption({
      label: "Scene",
      currentOption: this.props.selectedSceneName,
      options: this.props.sceneNames,
      optionToValueFunc: identity,
      onChange: this.props.actions.setSelectedSceneName,
    });
  }

  private renderVisualizationGroupSelector() {
    return this.renderDropDownOption({
      label: "Vis Group",
      currentOption: this.props.selectedVisualizationGroupName,
      options: this.props.visualizationGroupNames,
      optionToValueFunc: identity,
      onChange: this.props.actions.setSelectedVisualizationGroupName,
    });
  }

  private renderVisualizationSelector() {
    return this.renderDropDownOption({
      label: "Visualization",
      currentOption: this.props.selectedVisualizationName,
      options: this.props.visualizationNames,
      optionToValueFunc: identity,
      onChange: this.props.actions.setSelectedVisualizationName,
    });
  }

  private renderAudioInputDevices() {
    const { audioInputs } = this.props;

    if (audioInputs === undefined) {
      return "(initializing audio in...)";
    }

    return this.renderDropDownOption({
      label: "Audio in",
      currentOption: this.props.selectedAudioInput,
      options: [null, ...audioInputs],
      optionToValueFunc: (opt) => (opt === null ? "" : opt.id),
      optionToLabelFunc: (opt) => (opt === null ? "<none>" : opt.name),
      onChange: this.props.actions.setAudioInput,
    });
  }

  private renderPianoMidiInputDevices() {
    return this.renderMidiDropDownOption({
      label: "Piano MIDI in",
      currentOption: this.props.selectedPianoMidiInput,
      options: this.props.midiInputs,
      onChange: this.props.actions.setPianoMidiInput,
    });
  }

  private renderPianoMidiThruDevices() {
    return this.renderMidiDropDownOption({
      label: "Piano MIDI thru",
      currentOption: this.props.selectedPianoMidiThru,
      options: this.props.midiOutputs,
      onChange: this.props.actions.setPianoMidiThru,
    });
  }

  private renderControllerMidiDevices() {
    return this.renderMidiDropDownOption({
      label: "Ctrl MIDI in",
      currentOption: this.props.selectedControllerMidiInput,
      options: this.props.midiInputs,
      onChange: this.props.actions.setControllerMidiInput,
    });
  }

  private renderBeatControllerDevices() {
    const { selectedBeatControllerType } = this.props;

    const options: BeatControllerType[] = ["manual", "ableton"];

    return this.renderDropDownOption({
      label: "Beat ctrl",
      currentOption: selectedBeatControllerType,
      options,
      optionToValueFunc: identity,
      onChange: this.props.actions.setBeatControllerType,
    });
  }

  private renderMidiDropDownOption<
    T extends WebMidi.MIDIInput | WebMidi.MIDIOutput
  >(attrs: {
    label: string;
    currentOption: T | null;
    options: T[];
    onChange: (newOption: T | null) => void;
  }) {
    return this.renderDropDownOption<T | null>({
      label: attrs.label,
      currentOption: attrs.currentOption,
      options: [null, ...attrs.options],
      optionToValueFunc: (opt) => (opt === null ? "" : opt.id),
      optionToLabelFunc: (opt) =>
        opt === null ? "<none>" : valueOrDefault(opt.name, opt.id),
      onChange: attrs.onChange,
    });
  }

  private renderDropDownOption<T>(attrs: {
    label: string;
    currentOption: T;
    options: readonly T[];
    optionToValueFunc: (option: T) => string;
    optionToLabelFunc?: (option: T) => string;
    onChange: (newOption: T) => void;
  }) {
    const { currentOption, options, optionToLabelFunc, optionToValueFunc } =
      attrs;

    const optionValues = options.map(optionToValueFunc);
    const optionLabels = optionToLabelFunc
      ? options.map(optionToLabelFunc)
      : optionValues;
    const currentValue = optionToValueFunc(currentOption);

    const wrappedOnChange = (event: React.ChangeEvent<any>) => {
      const i = optionValues.indexOf(event.target.value);
      if (i === -1) {
        throw new Error("invalid value");
      }
      attrs.onChange(options[i]);
    };

    return (
      <div className="RightSidebar-dropDownOption">
        <span className="RightSidebar-dropDownOptionLabel">
          {attrs.label}:{" "}
        </span>
        <div className="RightSidebar-dropDownOptionSelectContainer">
          <select
            className="RightSidebar-dropDownOptionSelect"
            value={currentValue}
            onChange={wrappedOnChange}
            tabIndex={-1}
          >
            {optionValues.map((value, i) => (
              <option key={value} value={value}>
                {optionLabels[i]}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }
}
