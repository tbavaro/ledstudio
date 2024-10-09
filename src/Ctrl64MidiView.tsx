import React from "react";

import styles from "./Ctrl64MidiView.module.scss";

export interface Props {
  input: WebMidi.MIDIInput;
  output: WebMidi.MIDIOutput;
}

export default class Ctrl64MidiView extends React.Component<Props, {}> {
  private readonly colors: ReadonlyArray<number> = [5, 13, 21, 37, 45];
  private curColorIndex: number = 0;

  public render() {
    const { input, output } = this.props;
    return (
      <>
        <div className={styles.root}>
          LaunchPad: {input.name} {output.name}
        </div>
        <div className={styles.button} onClick={this.onChangeButtonClick}>
          Change
        </div>
      </>
    );
  }

  public componentDidMount() {
    this.connectOutput(this.props.output);
    this.connectInput(this.props.input);
  }

  public componentWillUnmount() {
    this.disconnectInput(this.props.input);
    this.disconnectOutput(this.props.output);
  }

  public componentDidUpdate(prevProps: Readonly<Props>) {
    if (prevProps.output !== this.props.output) {
      this.disconnectOutput(prevProps.output);
      this.connectOutput(this.props.output);
    }

    if (prevProps.input !== this.props.input) {
      this.disconnectInput(prevProps.input);
      this.connectInput(this.props.input);
    }
  }

  private connectInput(input: WebMidi.MIDIInput) {
    console.log("connecting ctrl64 in", input.name, input.id);
    input.addEventListener("midimessage", this.onMidiMessage);
  }

  private disconnectInput(input: WebMidi.MIDIInput) {
    console.log("disconnecting ctrl64 in", input.name);
    input.removeEventListener("midimessage", this.onMidiMessage);
  }

  private connectOutput(output: WebMidi.MIDIOutput) {
    console.log("connecting ctrl64 out", output.name, output.id, output.state);

    // enable DAW mode? not actually sure this does anything
    output.send([240, 0, 32, 41, 2, 12, 16, 1, 247]);

    this.setColor(this.colors[this.curColorIndex]);
  }

  private disconnectOutput(output: WebMidi.MIDIOutput) {
    console.log("disconnecting ctrl64 out", output.name);
  }

  private readonly onMidiMessage = (event: WebMidi.MIDIMessageEvent) => {
    console.log("ctrl64 midi message", event.data);
  };

  private setColor(color: number) {
    this.props.output.send([144, 11, color]);
  }

  private readonly onChangeButtonClick = () => {
    // cycle color
    this.curColorIndex = (this.curColorIndex + 1) % this.colors.length;
    this.setColor(this.colors[this.curColorIndex]);

    // // send "hello world" [doesn't seem to work]
    // output.send([
    //   240, 0, 32, 41, 2, 12, 7, 1, 7, 0, 37, 72, 101, 104, 104, 111, 32, 87,
    //   111, 114, 104, 100, 247
    // ]);
  };
}
