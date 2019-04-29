import MIDIFile from "midifile";
import * as React from "react";

import MidiEvent from "./MidiEvent";
import MidiEventsView from "./MidiEventsView";
import MIDIPlayer from "./MIDIPlayer";
import PianoView from "./PianoView";

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

  public componentWillMount() {
    if (super.componentWillMount) {
      super.componentWillMount();
    }

    this.midiPlayer.onSend = this.onSendMidiEvent;

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
        <div className="App-body" children={this.renderBody()}/>
        <div className="App-pianoContainer">
          <PianoView ref={this.setPianoViewRef}/>
        </div>
      </div>
    );
  }

  private renderBody() {
    switch (this.state.midiState.status) {
      case "initializing":
        return "Initializing...";

      case "loaded":
        return this.renderLoadedBody(this.state.midiState.webMidi);

      case "failed":
        return "failed";
    }
  }

  private renderLoadedBody(webMidi: WebMidi.MIDIAccess) {
    return (
      <React.Fragment>
        {this.renderMidiFileSelector()}
        {this.renderOutputDevices(webMidi)}
        {this.renderMusicControls()}
        <MidiEventsView ref={this.setMidiEventsViewRef}/>
      </React.Fragment>
    );
  }

  private renderMidiFileSelector() {
    return (
      <div className="App-midiFiles">
        <span>MIDI file: </span>
        <select
          value={this.state.midiFilename}
          onChange={this.handleSetMidiFilename}
        >
          {
            MIDI_FILES.map(filename => (
              <option key={filename} value={filename}>{filename}</option>
            ))
          }
        </select>
        {this.state.midiData !== null ? " (loaded)" : " (not loaded)" }
      </div>
    );
  }

  private renderOutputDevices(webMidi: WebMidi.MIDIAccess) {
    const outputs = Array.from(webMidi.outputs.entries());
    return (
      <div className="App-outputDevices">
        <span>Output device: </span>
        <select
          value={this.state.midiOutput === null ? "" : this.state.midiOutput.id}
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
      <div className="App-musicControls">
        <a href="#" onClick={this.handlePlayMusic}>Play music</a>
        <br/>
        <a href="#" onClick={this.handleStopMusic}>Stop music</a>
      </div>
    )
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

  private handleSetMidiOutput = (event: React.ChangeEvent<any>) => {
    const id = event.target.value as string;
    if (this.state.midiState.status === "loaded") {
      const output = this.state.midiState.webMidi.outputs.get(id) || null;
      this.setMidiOutput(output);
    } else {
      this.setMidiOutput(null);
    }
  }

  private setMidiOutput(newValue: WebMidi.MIDIOutput | null) {
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
    this.midiEventsViewRef.onSend(event);
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

  private unsafeMidiEventsViewRef: MidiEventsView | null = null;
  private setMidiEventsViewRef = (newRef: MidiEventsView) => this.unsafeMidiEventsViewRef = newRef;
  private get midiEventsViewRef(): MidiEventsView {
    if (this.unsafeMidiEventsViewRef === null) {
      throw new Error("ref not set");
    }
    return this.unsafeMidiEventsViewRef;
  }

  private unsafePianoViewRef: PianoView | null = null;
  private setPianoViewRef = (newRef: PianoView) => this.unsafePianoViewRef = newRef;
  private get pianoViewRef(): PianoView {
    if (this.unsafePianoViewRef === null) {
      throw new Error("ref not set");
    }
    return this.unsafePianoViewRef;
  }

  private loadMidiFile(filename: string) {
    if (filename !== this.state.midiFilename) {
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

  private handleSetMidiFilename = (event: React.ChangeEvent<any>) => {
    this.midiPlayer.stop();
    const filename = event.target.value as string;
    this.loadMidiFile(filename);
  }
}

export default App;
