import MIDIFile from "midifile";

declare class MIDIPlayer {
  constructor(/* options: any */);
  output: WebMidi.MIDIOutput | null;
  // volume: any;
  // startTime: any;
  // pauseTime: any;
  // events: any;
  // notesOn: any;
  // midiFile: any;
  load(midiFile: MIDIFile): void;
  pause(): void;
  play(endCallback?: () => void): void;
  processPlay(): void;
  resume(endCallback?: () => void): void;
  stop(): void;
  onSend: (data: Parameters<WebMidi.MIDIOutput["send"]>[0], timestamp: Parameters<WebMidi.MIDIOutput["send"]>[1]) => void | null;
}

export default MIDIPlayer;
