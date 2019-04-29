import MIDIFile from "midifile";
import * as React from "react";

import MidiEvent from "./MidiEvent";
import { MidiEventEmitter } from "./MidiEventListener";
import MIDIPlayer from "./MIDIPlayer";
import PianoView from "./PianoView";
import * as RightSidebar from "./RightSidebar";

import "./App.css";

const MIDI_FILES = [
  "abovo.mid",
  "bach_846.mid",
  "thegift.mid"
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
  midiState: Readonly<MidiState>;
  midiOutput: WebMidi.MIDIOutput | null;
  midiFilename: string;
  midiData: ArrayBuffer | null;
};

type AllActions = RightSidebar.Actions;

class App extends React.Component<{}, State> {
  public state: State = {
    midiState: {
      status: "initializing"
    },
    midiOutput: null,
    midiFilename: "<<not assigned>>",
    midiData: null
  };

  private midiPlayer = new MIDIPlayer();
  private midiEventEmitter = new MidiEventEmitter();

  public componentWillMount() {
    if (super.componentWillMount) {
      super.componentWillMount();
    }

    this.midiPlayer.onSend = this.onSendMidiEvent;

    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess().then(webMidi => {
        const outputs = Array.from(webMidi.outputs.values());
        const defaultOutput = (outputs.length === 0 ? null : outputs[0]);
        this.setState({
          midiState: {
            status: "loaded",
            webMidi: webMidi,
          }
        });
        this.setMidiOutput(defaultOutput);
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
  }

  public render() {
    return (
      <div className="App">
        <div className="App-viewportGroup">
          <div className="App-viewportContainer"/>
          <div className="App-pianoContainer">
            <PianoView ref={this.setPianoViewRef}/>
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
            webMidi={this.state.midiState.webMidi}
            midiFilenames={MIDI_FILES}
            isMidiFileLoaded={this.state.midiData !== null}
            selectedMidiFilename={this.state.midiFilename}
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
    this.pianoViewRef.reset();
    this.midiPlayer.play();
  }

  private handleStopMusic = () => this.midiPlayer.stop();

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
    const event = new MidiEvent(data, timestamp);
    this.midiEventEmitter.fire(event);
    switch(event.data[0]) {
      case 0x80:
      case 0x90:
        this.pianoViewRef.setKeyPressed(event.data[1], event.data[0] === 0x90);
        break;

      default:
        break;
    }
    // console.log("send", data);
  }

  private unsafePianoViewRef: PianoView | null = null;
  private setPianoViewRef = (newRef: PianoView) => this.unsafePianoViewRef = newRef;
  private get pianoViewRef(): PianoView {
    if (this.unsafePianoViewRef === null) {
      throw new Error("ref not set");
    }
    return this.unsafePianoViewRef;
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

  private actionManager: AllActions = {
    playMusic: this.handlePlayMusic,
    stopMusic: this.handleStopMusic,
    setMidiOutput: this.setMidiOutput,
    setSelectedMidiFilename: this.loadMidiFile
  };
}

export default App;
