export default MIDIFile;
declare class MIDIFile {
  constructor(buffer: ArrayBuffer, strictMode?: boolean);
  // header: any;
  // tracks: any;
  // addTrack(index: any): void;
  // deleteTrack(index: any): void;
  // getContent(): any;
  // getEvents(type: any, subtype: any): any;
  // getLyrics(): any;
  // getMidiEvents(): any;
  // getTrackEvents(index: any): any;
  // setTrackEvents(index: any, events: any): void;
}
declare namespace MIDIFile {
  // class Header {
  //   static FRAMES_PER_SECONDS: number;
  //   static HEADER_LENGTH: number;
  //   static TICKS_PER_BEAT: number;
  //   constructor(buffer: any);
  //   datas: any;
  //   getFormat(): any;
  //   getSMPTEFrames(): any;
  //   getTickResolution(tempo: any): any;
  //   getTicksPerBeat(): any;
  //   getTicksPerFrame(): any;
  //   getTimeDivision(): any;
  //   getTracksCount(): any;
  //   setFormat(format: any): void;
  //   setSMTPEDivision(smpteFrames: any, ticksPerFrame: any): void;
  //   setTicksPerBeat(ticksPerBeat: any): void;
  //   setTracksCount(n: any): any;
  // }
  // class Track {
  //   static HDR_LENGTH: number;
  //   constructor(buffer: any, start: any);
  //   datas: any;
  //   getTrackContent(): any;
  //   getTrackLength(): any;
  //   setTrackContent(dataView: any): void;
  //   setTrackLength(trackLength: any): any;
  // }
}
