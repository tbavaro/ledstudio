/* tslint:disable */

'use strict';

// "forked" from https://github.com/nfroidure/midiplayer/blob/ec63f6af331a8ee77c0d78b945c1545c38aadeb2/src/MIDIPlayer.js

var MIDIEvents = require('midievents');

// Constants
var PLAY_BUFFER_DELAY = 300;
var PAGE_HIDDEN_BUFFER_RATIO = 20;

// MIDIPlayer constructor
function MIDIPlayer(options) {
  var i;

  options = options || {};
  this.output = options.output || null; // midi output
  this.onSend = null;
  this.volume = options.volume || 100; // volume in percents
  this.startTime = -1; // ms since page load
  this.pauseTime = -1; // ms elapsed before player paused
  this.events = [];
  this.notesOn = new Array(32); // notesOn[channel][note]
  for(i = 31; 0 <= i; i--) {
    this.notesOn[i] = [];
  }
  this.midiFile = null;
  window.addEventListener('unload', this.stop.bind(this));
}

// Parsing all tracks and add their events in a single event queue
MIDIPlayer.prototype.load = function(midiFile) {
  this.stop();
  this.position = 0;
  this.midiFile = midiFile;
  this.events = this.midiFile.getMidiEvents();
};

MIDIPlayer.prototype.play = function(endCallback) {
  this.endCallback = endCallback;
  if(0 === this.position) {
    this.startTime = performance.now();
    this.timeout = setTimeout(this.processPlay.bind(this), 0);
    return 1;
  }
  return 0;
};

MIDIPlayer.prototype.processPlay = function() {
  var elapsedTime = performance.now() - this.startTime;
  var event;
  var index;
  var param2;
  var bufferDelay = PLAY_BUFFER_DELAY * (
    document.hidden || document.mozHidden || document.webkitHidden ||
      document.msHidden || document.oHidden ?
    PAGE_HIDDEN_BUFFER_RATIO :
    1
  );
  event = this.events[this.position];
  while(this.events[this.position] && event.playTime - elapsedTime < bufferDelay) {
    param2 = 0;
    if(event.subtype === MIDIEvents.EVENT_MIDI_NOTE_ON) {
      param2 = Math.floor(event.param1 * ((this.volume || 1) / 100));
      this.notesOn[event.channel].push(event.param1);
    } else if(event.subtype === MIDIEvents.EVENT_MIDI_NOTE_OFF) {
      index = this.notesOn[event.channel].indexOf(event.param1);
      if(-1 !== index) {
        this.notesOn[event.channel].splice(index, 1);
      }
    }
    this.doSend(
      -1 !== MIDIEvents.MIDI_1PARAM_EVENTS.indexOf(event.subtype) ?
      [(event.subtype << 4) + event.channel, event.param1] :
      [(event.subtype << 4) + event.channel, event.param1, (param2 || event.param2 || 0x00)],
      Math.floor(event.playTime + this.startTime)
    );
    this.lastPlayTime = event.playTime + this.startTime;
    this.position++;
    event = this.events[this.position];
  }
  if(this.position < this.events.length - 1) {
    this.timeout = setTimeout(this.processPlay.bind(this), PLAY_BUFFER_DELAY - 250);
  } else {
    setTimeout(this.endCallback, PLAY_BUFFER_DELAY + 100);
    this.position = 0;
  }
};

MIDIPlayer.prototype.pause = function() {
  var i;
  var j;

  if(this.timeout) {
    clearTimeout(this.timeout);
    this.timeout = null;
    this.pauseTime = performance.now();
    for(i = this.notesOn.length - 1; 0 <= i; i--) {
      for(j = this.notesOn[i].length - 1; 0 <= j; j--) {
        this.doSend([(MIDIEvents.EVENT_MIDI_NOTE_OFF << 4) + i, this.notesOn[i][j],
          0x00], this.lastPlayTime + 100);
      }
    }
    return true;
  }
  return false;
};

MIDIPlayer.prototype.resume = function(endCallback) {
  this.endCallback = endCallback;
  if(this.events && this.events[this.position] && !this.timeout) {
    this.startTime += performance.now() - this.pauseTime;
    this.timeout = setTimeout(this.processPlay.bind(this), 0);
    return this.events[this.position].playTime;
  }
  return 0;
};

MIDIPlayer.prototype.stop = function() {
  var i;

  if(this.pause()) {
    this.position = 0;
    for(i = 31; 0 <= i; i--) {
      this.notesOn[i] = [];
    }
    return true;
  }
  return false;
};

MIDIPlayer.prototype.doSend = function(data, timestamp) {
  this.output.send(data, timestamp);
  if (this.onSend) {
    this.onSend(data, timestamp);
  }
}

module.exports = MIDIPlayer;
