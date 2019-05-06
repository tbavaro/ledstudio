import MIDIFile from "midifile";
import * as React from "react";

import MidiEvent from "./MidiEvent";
import { QueuedMidiEventEmitter } from "./MidiEventListener";
import MIDIPlayer from "./MIDIPlayer";
import PianoView from "./PianoView";
import * as PianoVisualizations from "./portable/PianoVisualizations";
import * as RightSidebar from "./RightSidebar";
import SceneDefs from "./SceneDefs";
import SimulationViewport from "./SimulationViewport";

import "./App.css";

const MIDI_FILES = [
  "abovo.mid",
  "thegift.mid",
  "bach_846.mid",
  "beethoven_opus10_2.mid",
  "chpn_op27_1.mid",
  "chpn_op66.mid",
  "grieg_zwerge.mid"
];

const MIDI_FILE_PATH_PREFIX = "./";

type MidiState = {
  status: "initializing"
} | {
  status: "loaded",
  webMidi: WebMidi.MIDIAccess
} | {
  status: "failed",
  midiFailureReason: any
};

interface State {
  visualizationName: PianoVisualizations.Name;
  midiState: Readonly<MidiState>;
  midiInput: WebMidi.MIDIInput | null;
  midiOutput: WebMidi.MIDIOutput | null;
  midiFilename: string;
  midiData: ArrayBuffer | null;
  midiInputs: WebMidi.MIDIInput[];
  midiOutputs: WebMidi.MIDIOutput[];
}

type AllActions = RightSidebar.Actions;

class App extends React.Component<{}, State> {
  public state: State = {
    visualizationName: PianoVisualizations.defaultName,
    midiState: {
      status: "initializing"
    },
    midiInput: null,
    midiOutput: null,
    midiFilename: "<<not assigned>>",
    midiData: null,
    midiInputs: [],
    midiOutputs: []
  };

  private midiPlayer = new MIDIPlayer();
  private midiEventEmitter = new QueuedMidiEventEmitter();

  public componentWillMount() {
    if (super.componentWillMount) {
      super.componentWillMount();
    }

    this.midiPlayer.onSend = this.onSendMidiEvent;

    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess().then(webMidi => {
        this.setState({
          midiState: {
            status: "loaded",
            webMidi: webMidi,
          }
        });

        const inputs = Array.from(webMidi.inputs.values());
        const defaultInput = (inputs.length === 0 ? null : inputs[0]);
        this.setMidiInput(defaultInput);

        const outputs = Array.from(webMidi.outputs.values());
        const defaultOutput = (outputs.length === 0 ? null : outputs[0]);
        this.setMidiOutput(defaultOutput);

        this.updateMidiDevices();

        webMidi.addEventListener("statechange", this.updateMidiDevices);
      }).catch(reason => {
        console.log("exception requesting MIDI access", reason);
        this.setState({
          midiState: {
            status: "failed",
            midiFailureReason: reason
          }
        });
      });
    } else {
      this.setState({
        midiState: {
          status: "failed",
          midiFailureReason: "MIDI access not supported on this browser"
        }
      });
    }

    this.loadMidiFile(MIDI_FILES[0]);
  }

  public componentWillUnmount() {
    if (super.componentWillUnmount) {
      super.componentWillUnmount();
    }

    this.midiPlayer.stop();

    const { midiState } = this.state;
    if (midiState.status === "loaded") {
      midiState.webMidi.removeEventListener("statechange", this.updateMidiDevices);
    }
  }

  public render() {
    return (
      <div className="App">
        <div className="App-viewportGroup">
          <div className="App-viewportContainer">
            <SimulationViewport
              midiEventEmitter={this.midiEventEmitter}
              sceneDef={SceneDefs[0]}
              visualizationName={this.state.visualizationName}
            />
          </div>
          <div className="App-pianoContainer">
            <PianoView
              midiEventEmitter={this.midiEventEmitter}
            />
          </div>
        </div>
        <div className="App-sidebarContainer">
          {this.renderSidebarContents()}
        </div>
      </div>
    );
  }

  private renderSidebarContents() {
    switch (this.state.midiState.status) {
      case "initializing":
        return "Initializing...";

      case "loaded":
        return (
          <RightSidebar.default
            actions={this.actionManager}
            visualizationNames={PianoVisualizations.names}
            selectedVisualizationName={this.state.visualizationName}
            midiFilenames={MIDI_FILES}
            isMidiFileLoaded={this.state.midiData !== null}
            selectedMidiFilename={this.state.midiFilename}
            midiInputs={this.state.midiInputs}
            selectedMidiInput={this.state.midiInput}
            midiOutputs={this.state.midiOutputs}
            selectedMidiOutput={this.state.midiOutput}
            midiEventEmitter={this.midiEventEmitter}
          />
        );

      case "failed":
        return `error: ${this.state.midiState.midiFailureReason}`;
    }
  }

  private handlePlayMusic = () => {
    if (this.state.midiState.status !== "loaded") {
      alert("midi subsystem is not loaded");
      return;
    }

    if (this.state.midiData === null) {
      alert("midi data is not loaded");
      return;
    }

    if (this.midiPlayer.output === null) {
      alert("No MIDI output");
      return;
    }

    const file = new MIDIFile(this.state.midiData);
    this.midiPlayer.load(file);
    this.midiPlayer.play();
  }

  private handleStopMusic = () => this.midiPlayer.stop();

  private setMidiInput = (newValue: WebMidi.MIDIInput | null) => {
    if (newValue !== this.state.midiInput) {
      this.setState({ midiInput: newValue });
    }
  }

  private setMidiOutput = (newValue: WebMidi.MIDIOutput | null) => {
    if (newValue !== this.state.midiOutput) {
      this.midiPlayer.stop();
      this.midiPlayer.output = newValue;
      this.setState({ midiOutput: newValue });
    }
  }

  private onSendMidiEvent = (
    data: number[] | Uint8Array,
    timestamp?: number
  ) => {
    const event = new MidiEvent(data);
    this.midiEventEmitter.fireLater(event, timestamp || performance.now());
  }

  private loadMidiFile = (filename: string) => {
    if (filename !== this.state.midiFilename) {
      this.midiPlayer.stop();
      this.setState({
        midiData: null,
        midiFilename: filename
      });

      const req = new XMLHttpRequest();
      req.open("GET", MIDI_FILE_PATH_PREFIX + filename, true);
      req.responseType = "arraybuffer";
      req.onload = () => {
        if (filename === this.state.midiFilename) {
          this.setState({ midiData: req.response });
        }
      };
      req.send();
    }
  }

  private updateMidiDevices = () => {
    const { midiInput, midiOutput, midiState } = this.state;
    if (midiState.status !== "loaded") {
      return;
    }

    const { webMidi } = midiState;
    if (midiInput !== null) {
      this.setMidiInput(webMidi.inputs.get(midiInput.id) || null);
    }
    if (midiOutput !== null) {
      this.setMidiOutput(webMidi.outputs.get(midiOutput.id) || null);
    }

    this.setState({
      midiInputs: Array.from(webMidi.inputs.values()),
      midiOutputs: Array.from(webMidi.outputs.values())
    });
  }

  private actionManager: AllActions = {
    playMusic: this.handlePlayMusic,
    stopMusic: this.handleStopMusic,
    setMidiInput: this.setMidiInput,
    setMidiOutput: this.setMidiOutput,
    setSelectedMidiFilename: this.loadMidiFile,
    setSelectedVisualizationName: (newValue: PianoVisualizations.Name) => {
      this.setState({ visualizationName: newValue });
    }
  };
}

export default App;
