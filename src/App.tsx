import * as React from "react";
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
};

class App extends React.Component<{}, State> {
  public state: State = {
    midiState: {
      status: "initializing"
    }
  };

  public componentWillMount() {
    if (super.componentWillMount) {
      super.componentWillMount();
    }

    navigator.requestMIDIAccess().then(webMidi => {
      this.setState({
        midiState: {
          status: "loaded",
          webMidi: webMidi
        }
      });
    }).catch(reason => {
      console.log("exception requesting MIDI access", reason);
      this.setState({
        midiState: {
          status: "failed",
          midiFailureReason: reason
        }
      });
    });
  }

  public render() {
    return (
      <div className="App" children={this.renderBody()} />
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
    const names = Array.from(webMidi.outputs.keys());
    console.log("names", names);

    return (
      <div className="App-devices">
        <div>Devices ({names.length}):</div>
        <ul>
          {
            names.map((name, i) => <li key={i}>{name}</li>)
          }
        </ul>
      </div>
    );
  }
}

export default App;
