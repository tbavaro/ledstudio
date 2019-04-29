import MIDIFile from "midifile";
import * as React from "react";

import MidiEvent from "./MidiEvent";
import MidiEventsView from "./MidiEventsView";
import MIDIPlayer from "./MIDIPlayer";
import PianoView from "./PianoView";

import "./App.css";

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
  midiData: ArrayBuffer | null;
};

class App extends React.Component<{}, State> {
  public state: State = {
    midiState: {
      status: "initializing"
    },
    midiOutput: null,
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

    const req = new XMLHttpRequest();
    req.open("GET", "./bach_846.mid", true);
    req.responseType = "arraybuffer";
    req.onload = (event: ProgressEvent) => {
      this.setState({ midiData: req.response });
    };
    req.send();
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
          <PianoView/>
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
        <div>
          MIDI Data: {this.state.midiData ? "loaded" : "not loaded" }
        </div>
        {this.renderOutputDevices(webMidi)}
        {this.renderMusicControls()}
        <MidiEventsView ref={this.setMidiEventsViewRef}/>
      </React.Fragment>
    );
  }

  private renderOutputDevices(webMidi: WebMidi.MIDIAccess) {
    const outputs = Array.from(webMidi.outputs.entries());
    return (
      <div className="App-outputDevices">
        <span>Devices ({outputs.length}): </span>
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
}

export default App;
