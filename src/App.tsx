import MIDIFile from "midifile";
import * as React from "react";

import * as PianoHelpers from "./portable/PianoHelpers";
import * as PianoVisualizations from "./portable/PianoVisualizations";
import { MovingAverageHelper } from "./portable/Utils";

import FadecandyClient from "./hardware/FadecandyClient";
import FadecandyLedStrip from "./hardware/FadecandyLedStrip";

import Scene from "./scenes/Scene";
import * as Scenes from "./scenes/Scenes";

import SimulationViewport from "./simulator/SimulationViewport";
import * as SimulatorStickySettings from "./simulator/SimulatorStickySettings";

import MidiEvent from "./piano/MidiEvent";
import MidiEventListener, { QueuedMidiEventEmitter } from "./piano/MidiEventListener";
import MIDIPlayer from "./piano/MIDIPlayer";

import * as AnalogAudio from "./analogAudio/AnalogAudio";
import AnalogAudioView from "./analogAudio/AnalogAudioView";

import PianoView from "./PianoView";
import PianoVisualizationRunner from "./PianoVisualizationRunner";
import * as RightSidebar from "./RightSidebar";

import "./App.css";
import TimingStatsView from "./TimingStatsView";

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

const TARGET_FPS = 60;
const TARGET_FRAME_MILLIS = 1000 / TARGET_FPS;

interface State {
  scene: Scene;
  visualizationName: PianoVisualizations.Name;
  visualizationRunner: PianoVisualizationRunner;
  midiState: Readonly<MidiState>;
  midiInput: WebMidi.MIDIInput | null;
  midiOutput: WebMidi.MIDIOutput | null;
  midiFilename: string;
  midiData: ArrayBuffer | null;
  midiInputs: WebMidi.MIDIInput[];
  midiOutputs: WebMidi.MIDIOutput[];
  analogInputs: AnalogAudio.InputDeviceInfo[] | undefined;
  selectedAnalogInputId: string | null;
}

type AllActions = RightSidebar.Actions;

const ENABLE_SIMULATION = (window.location.search !== "?disableSimulation");

function tryGetById<T extends { id: string}>(objs: ReadonlyArray<T>, id: string | null): T | null | undefined {
  if (id === null) {
    return null;
  }

  return objs.find(obj => obj.id === id);
}

function createIsValidIdFunc<T extends { id: string}>(objs: ReadonlyArray<T>) {
  return (id: string | null) => tryGetById(objs, id) !== undefined;
}

function getById<T extends { id: string }>(objs: ReadonlyArray<T>, id: string | null): T | null {
  const obj = tryGetById(objs, id);
  if (obj === undefined) {
    throw new Error(`can't find by id: ${id}`);
  }
  return obj;
}

function getByStickyIdKeyOrFirst<T extends { id: string }>(
  objs: ReadonlyArray<T>,
  key: keyof SimulatorStickySettings.Settings
): T | null {
  const idOrNull = SimulatorStickySettings.get({
    key: key,
    defaultValue: (objs.length === 0 ? null : objs[0].id),
    validateFunc: createIsValidIdFunc(objs)
  });
  return getById(objs, idOrNull);
}

class App extends React.Component<{}, State> {
  private readonly midiPlayer = new MIDIPlayer();
  private readonly midiEventEmitter = new QueuedMidiEventEmitter();
  private readonly fadeCandyLedStrip = new FadecandyLedStrip(new FadecandyClient());
  public readonly analogAudio = new AnalogAudio.default();

  public componentWillMount() {
    if (super.componentWillMount) {
      super.componentWillMount();
    }

    this.analogAudio.addEventListener("deviceListChanged", this.updateAnalogDevices);
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
        const defaultInput = getByStickyIdKeyOrFirst(inputs, "midiInputId");
        this.setMidiInput(defaultInput);

        const outputs = Array.from(webMidi.outputs.values());
        const defaultOutput = getByStickyIdKeyOrFirst(outputs, "midiOutputId");
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

    this.loadMidiFile(SimulatorStickySettings.get({
      key: "midiFilename",
      defaultValue: MIDI_FILES[0],
      validateFunc: v => MIDI_FILES.includes(v)
    }));
    this.midiEventEmitter.addListener(this.myMidiListener);
  }

  public componentDidMount() {
    if (super.componentDidMount) {
      super.componentDidMount();
    }
    this.startAnimation();
  }

  public componentWillUnmount() {
    if (super.componentWillUnmount) {
      super.componentWillUnmount();
    }

    this.stopAnimation();
    this.midiPlayer.stop();

    const { midiState } = this.state;
    if (midiState.status === "loaded") {
      midiState.webMidi.removeEventListener("statechange", this.updateMidiDevices);
    }
    this.midiEventEmitter.removeListener(this.myMidiListener);

    this.analogAudio.removeEventListener("deviceListChanged", this.updateAnalogDevices);
  }

  public render() {
    return (
      <div className="App">
        <div className="App-viewportGroup">
          <div className="App-viewportContainer">
            {
              ENABLE_SIMULATION
                ? (
                    <SimulationViewport
                      scene={this.state.scene}
                      visualizationRunner={this.state.visualizationRunner}
                      frameDidRender={this.simulationFrameDidRender}
                    />
                  )
                : null
            }
            <TimingStatsView getTimings={this.getTimings} message2={this.getMessage2}/>
          </div>
          <div className="App-analogAudioViewContainer">
            <AnalogAudioView ref={this.setAnalogAudioViewRef}/>
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
            sceneNames={Scenes.names()}
            selectedSceneName={this.state.scene.name}
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
            analogInputs={this.state.analogInputs}
            selectedAnalogInputId={this.state.selectedAnalogInputId}
          />
        );

      case "failed":
        return `error: ${this.state.midiState.midiFailureReason}`;
    }
  }

  private getMessage2 = () => this.state.scene.displayMessage;

  private handlePlayMusic = () => {
    if (this.state.midiState.status !== "loaded") {
      alert("midi subsystem is not loaded");
      return;
    }

    if (this.state.midiData === null) {
      alert("midi data is not loaded");
      return;
    }

    const file = new MIDIFile(this.state.midiData);
    this.midiPlayer.load(file);
    this.midiPlayer.play();
  }

  private handleStopMusic = () => this.midiPlayer.stop();

  private setMidiInput = (newValue: WebMidi.MIDIInput | null) => {
    if (newValue !== this.state.midiInput) {
      this.midiPlayer.stop();
      if (this.state.midiInput) {
        this.state.midiInput.removeEventListener("midimessage", this.onMidiInputMessage);
        this.resetAllKeys();
      }
      if (newValue) {
        newValue.addEventListener("midimessage", this.onMidiInputMessage);
      }
      this.setState({ midiInput: newValue });
      SimulatorStickySettings.set("midiInputId", newValue === null ? null : newValue.id);
    }
  }

  private setMidiOutput = (newValue: WebMidi.MIDIOutput | null) => {
    if (newValue !== this.state.midiOutput) {
      this.midiPlayer.output = newValue;
      this.setState({ midiOutput: newValue });
      SimulatorStickySettings.set("midiOutputId", newValue === null ? null : newValue.id);
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
      SimulatorStickySettings.set("midiFilename", filename);

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

  private visualizationRunnerForName(name: PianoVisualizations.Name, scene: Scene) {
    const vis = PianoVisualizations.create(name, scene.leds.map(row => row.length));
    const runner = new PianoVisualizationRunner(vis, scene);
    runner.hardwardLedStrip = this.fadeCandyLedStrip;
    return runner;
  }

  private updateVisualizationAndScene(
    visualizationName: PianoVisualizations.Name,
    scene: Scene,
    doNotSetState?: boolean
  ) {
    const runner = this.visualizationRunnerForName(visualizationName, scene);
    const values = {
      visualizationRunner: runner,
      visualizationName: visualizationName,
      scene: scene
    };
    if (!doNotSetState) {
      this.setState(values);
    }
    return values;
  }

  private actionManager: AllActions = {
    playMusic: this.handlePlayMusic,
    stopMusic: this.handleStopMusic,
    setMidiInput: this.setMidiInput,
    setMidiOutput: this.setMidiOutput,
    setSelectedMidiFilename: this.loadMidiFile,
    setSelectedSceneName: (name: string) => {
      if (name !== this.state.scene.name) {
        const scene = Scenes.getScene(name);
        this.updateVisualizationAndScene(this.state.visualizationName, scene);
        SimulatorStickySettings.set("sceneName", name);
      }
    },
    setSelectedVisualizationName: (newValue: PianoVisualizations.Name) => {
      if (this.state.visualizationName !== newValue) {
        this.updateVisualizationAndScene(newValue, this.state.scene);
        SimulatorStickySettings.set("visualizationName", newValue);
      }
    },
    setAnalogInputId: (newValue: string | null) => {
      this.setState({ selectedAnalogInputId: newValue });
      this.analogAudio.setCurrentDeviceId(newValue);
      SimulatorStickySettings.set("analogAudioSourceId", newValue);
    }
  };

  private onMidiInputMessage = (message: WebMidi.MIDIMessageEvent) => {
    const event = new MidiEvent(message.data);
    this.midiEventEmitter.fire(event);

    if (
      this.state.midiOutput !== null &&
      this.state.midiInput !== null &&
      this.state.midiOutput.name !== this.state.midiInput.name
    ) {
      this.state.midiOutput.send(message.data);
    }
  }

  private resetAllKeys = () => {
    this.midiEventEmitter.reset();
    PianoHelpers.resetAllKeysMidiDatas().forEach(data => {
      this.midiEventEmitter.fire(new MidiEvent(data, /*suppressDisplay=*/true));
    });
  }

  private myMidiListener: MidiEventListener = {
    onMidiEvent: (event: MidiEvent) => this.state.visualizationRunner.onMidiEvent(event)
  };

  private animating = false;
  private startAnimation() {
    if (!this.animating) {
      this.animating = true;
      this.scheduleNextAnimationFrame();
    }
  }
  private stopAnimation() {
    this.animating = false;
  }

  private prevAnimationStartTimeTarget = 0;
  private nextAnimationTimeout?: NodeJS.Timeout;

  private scheduleNextAnimationFrame = () => {
    if (this.nextAnimationTimeout !== undefined) {
      clearTimeout(this.nextAnimationTimeout);
      this.nextAnimationTimeout = undefined;
    }

    const now = performance.now();
    const nextAnimationStartTime = Math.max(now, this.prevAnimationStartTimeTarget + TARGET_FRAME_MILLIS);
    this.nextAnimationTimeout = setTimeout(this.animate, nextAnimationStartTime - now);
    this.prevAnimationStartTimeTarget = nextAnimationStartTime;
  }

  private animate = () => {
    if (this.animating) {
      this.scheduleNextAnimationFrame();

      const frequencyData = this.analogAudio.getFrequencyData();
      const frameTimeseriesData = this.state.visualizationRunner.renderFrame(frequencyData);
      ++this.framesRenderedSinceLastTimingsCall;

      if (this.analogAudioViewRef) {
        this.analogAudioViewRef.displayFrequencyData(frequencyData, frameTimeseriesData);
      }
    }
  }

  private getTimings = () => {
    const result = {
      visualizationMillis: this.state.visualizationRunner.averageRenderTime,
      fadeCandyMillis: this.fadeCandyLedStrip.averageSendTime,
      renderMillis: (ENABLE_SIMULATION ? this.renderTimingHelper.movingAverage : 0),
      framesRenderedSinceLastCall: this.framesRenderedSinceLastTimingsCall
    };
    this.framesRenderedSinceLastTimingsCall = 0;
    return result;
  }

  private readonly renderTimingHelper: MovingAverageHelper = new MovingAverageHelper(20);
  private framesRenderedSinceLastTimingsCall = 0;

  private simulationFrameDidRender = (renderMillis: number) => {
    this.renderTimingHelper.addValue(renderMillis);
  }

  private updateAnalogDevices = () => {
    const isInitialization = (this.state.analogInputs === undefined);
    this.setState({
      analogInputs: this.analogAudio.inputDevices,
    });

    if (isInitialization) {
      this.actionManager.setAnalogInputId(this.initialAnalogAudioDeviceId());
    }
  }

  private analogAudioViewRef: AnalogAudioView | undefined = undefined;
  private setAnalogAudioViewRef = (newRef: AnalogAudioView) => this.analogAudioViewRef = newRef;

  private initialVisualizationName(): PianoVisualizations.Name {
    return SimulatorStickySettings.get({
      key: "visualizationName",
      defaultValue: PianoVisualizations.defaultName,
      validateFunc: PianoVisualizations.isValidName
    });
  }

  private initialScene(): Scene {
    const name = SimulatorStickySettings.get({
      key: "sceneName",
      defaultValue: Scenes.defaultSceneName,
      validateFunc: Scenes.isValidName
    });
    return Scenes.getScene(name);
  }

  private initialAnalogAudioDeviceId(): string | null {
    return SimulatorStickySettings.get({
      key: "analogAudioSourceId",
      defaultValue: this.analogAudio.defaultDeviceId,
      validateFunc: this.analogAudio.isValidId
    });
  }

  public state = ((): State => {
    const scene = this.initialScene();
    return {
      ...this.updateVisualizationAndScene(
        this.initialVisualizationName(),
        scene,
        /*doNotSetState=*/true
      ),
      midiState: {
        status: "initializing"
      },
      midiInput: null,
      midiOutput: null,
      midiFilename: "<<not assigned>>",
      midiData: null,
      midiInputs: [],
      midiOutputs: [],
      analogInputs: undefined,
      selectedAnalogInputId: null
    };
  })();
}

export default App;
