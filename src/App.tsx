import MIDIFile from "midifile";
import * as React from "react";

import ManualBeatController from "./beat/ManualBeatController";

import BeatController from "./portable/base/BeatController";
import ControllerState from "./portable/base/ControllerState";

import * as PianoHelpers from "./portable/PianoHelpers";
import * as Visualizations from "./portable/Visualizations";

import { MovingAverageHelper } from "./util/Utils";

import FadecandyClient from "./hardware/FadecandyClient";
import FadecandyLedSender from "./hardware/FadecandyLedSender";

import Scene from "./scenes/Scene";
import * as Scenes from "./scenes/Scenes";

import SimulationViewport from "./simulator/SimulationViewport";
import * as SimulatorStickySettings from "./simulator/SimulatorStickySettings";
import VisualizerExtraDisplayContainer from "./simulator/VisualizerExtraDisplayContainer";

import MidiEvent from "./piano/MidiEvent";
import MidiEventListener, { MidiEventEmitter, QueuedMidiEventEmitter } from "./piano/MidiEventListener";
import MIDIPlayer from "./piano/MIDIPlayer";

import * as AnalogAudio from "./analogAudio/AnalogAudio";
import AnalogAudioView from "./analogAudio/AnalogAudioView";

import BeatControlView from "./BeatControlView";
import ControlsView from "./ControlsView";
import PianoView from "./PianoView";
import * as RightSidebar from "./RightSidebar";
import TimingStatsView from "./TimingStatsView";
import VisualizationRunner from "./VisualizationRunner";

import "./App.css";
import AbletonLinkConnect from "./beat/AbletonLinkConnect";

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
  visualizationName: Visualizations.Name;
  visualizationRunner: VisualizationRunner;
  midiState: Readonly<MidiState>;
  midiInput: WebMidi.MIDIInput | null;
  midiControllerInput: WebMidi.MIDIInput | null;
  midiOutput: WebMidi.MIDIOutput | null;
  midiFilename: string;
  midiData: ArrayBuffer | null;
  midiInputs: WebMidi.MIDIInput[];
  midiOutputs: WebMidi.MIDIOutput[];
  analogInputs: AnalogAudio.InputDeviceInfo[] | undefined;
  selectedAnalogInputId: string | null;
  audioSource: AudioNode | null;
  visualizerExtraDisplay: HTMLElement | null;
  simulationEnabled: boolean;
  beatController: BeatController;
}

type AllActions = RightSidebar.Actions;

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

  if (typeof idOrNull !== "string") {
    return null;
  }

  return getById(objs, idOrNull);
}

class App extends React.Component<{}, State> {
  private readonly midiPlayer = new MIDIPlayer();
  private readonly midiEventEmitter = new QueuedMidiEventEmitter();
  private readonly midiControllerEventEmitter = new MidiEventEmitter();
  private readonly fadecandyClient = new FadecandyClient();
  public readonly analogAudio = new AnalogAudio.default((newAudioSource: AudioNode | null) => {
    this.configureVisualization(this.state.visualizationName, this.state.scene, newAudioSource);
  });
  private readonly controllerState = new ControllerState();

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
        const defaultControllerInput = getByStickyIdKeyOrFirst(inputs, "midiControllerInputId");
        this.setMidiControllerInput(defaultControllerInput);

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
              this.state.simulationEnabled
                ? (
                    <SimulationViewport
                      scene={this.state.scene}
                      visualizationRunner={this.state.visualizationRunner}
                      frameDidRender={this.simulationFrameDidRender}
                    />
                  )
                : null
            }
            {
              this.state.visualizerExtraDisplay === null
                ? null
                : (
                    <VisualizerExtraDisplayContainer element={this.state.visualizerExtraDisplay} />
                  )
            }
            {this.renderSimulationToggleSwitch()}
            <TimingStatsView getTimings={this.getTimings} message2={this.getMessage2}/>
          </div>
          <div className="App-analogAudioViewContainer">
            <AnalogAudioView ref={this.setAnalogAudioViewRef}/>
          </div>
          <div className="App-controllerStateContainer">
            <PianoView
              midiEventEmitter={this.midiEventEmitter}
            />
            <ControlsView
              controllerState={this.controllerState}
              ref={this.setControlsViewRef}
            />
            <BeatControlView beatController={this.state.beatController}/>
          </div>
        </div>
        <div className="App-sidebarContainer">
          {this.renderSidebarContents()}
        </div>
      </div>
    );
  }

  private renderSimulationToggleSwitch() {
    return (
      <div
        className={"App-simulationToggleSwitch" + (this.state.simulationEnabled ? " enabled" : "")}
        onClick={this.handleClickSimulationToggleSwitch}
      >
        { this.state.simulationEnabled ? "Disable simulation" : "Simulation is disabled — click here to enable" }
      </div>
    );
  }

  private handleClickSimulationToggleSwitch = () => {
    const newValue = !this.state.simulationEnabled;
    SimulatorStickySettings.set("simulationEnabled", newValue);
    this.setState({ simulationEnabled: newValue });
  }

  private renderSidebarContents() {
    switch (this.state.midiState.status) {
      case "initializing":
        return "Initializing...";

      case "loaded":
        const beatControllerType = (this.state.beatController instanceof ManualBeatController) ? "manual" : "ableton";
        return (
          <RightSidebar.default
            actions={this.actionManager}
            sceneNames={Scenes.names()}
            selectedSceneName={this.state.scene.name}
            visualizationNames={Visualizations.names}
            selectedVisualizationName={this.state.visualizationName}
            midiFilenames={MIDI_FILES}
            isMidiFileLoaded={this.state.midiData !== null}
            selectedMidiFilename={this.state.midiFilename}
            midiInputs={this.state.midiInputs}
            selectedMidiInput={this.state.midiInput}
            selectedMidiControllerInput={this.state.midiControllerInput}
            midiOutputs={this.state.midiOutputs}
            selectedMidiOutput={this.state.midiOutput}
            midiEventEmitters={[this.midiEventEmitter, this.midiControllerEventEmitter]}
            analogInputs={this.state.analogInputs}
            selectedAnalogInputId={this.state.selectedAnalogInputId}
            selectedBeatControllerType={beatControllerType}
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

  private setMidiControllerInput = (newValue: WebMidi.MIDIInput | null) => {
    if (newValue !== this.state.midiControllerInput) {
      if (this.state.midiControllerInput) {
        this.state.midiControllerInput.removeEventListener("midimessage", this.onMidiControllerInputMessage);
        this.resetAllKeys();
      }
      if (newValue) {
        newValue.addEventListener("midimessage", this.onMidiControllerInputMessage);
      }
      this.setState({
        midiControllerInput: newValue
      });
      SimulatorStickySettings.set("midiControllerInputId", newValue === null ? null : newValue.id);
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
    const { midiInput, midiOutput, midiState, midiControllerInput } = this.state;
    if (midiState.status !== "loaded") {
      return;
    }

    const { webMidi } = midiState;
    if (midiInput !== null) {
      this.setMidiInput(webMidi.inputs.get(midiInput.id) || null);
    }
    if (midiControllerInput !== null) {
      this.setMidiControllerInput(webMidi.inputs.get(midiControllerInput.id) || null);
    }
    if (midiOutput !== null) {
      this.setMidiOutput(webMidi.outputs.get(midiOutput.id) || null);
    }

    this.setState({
      midiInputs: Array.from(webMidi.inputs.values()),
      midiOutputs: Array.from(webMidi.outputs.values())
    });
  }

  private createBeatControllerType = (newValue: RightSidebar.BeatControllerType): BeatController => {
    switch (newValue) {
      case "manual":
        return new ManualBeatController();
        break;

      case "ableton":
        return new AbletonLinkConnect();
        break;

      default:
        throw new Error(`unsupported beat controller type: ${newValue}`);
    }
  }

  private configureVisualization(
    visualizationName: Visualizations.Name,
    scene: Scene,
    audioSource: AudioNode | null,
    doNotSetState?: boolean
  ) {
    let isInConfigure = true;
    let newVisualizerExtraDisplay: HTMLElement | null = null;
    const setVisualizerExtraDisplay = (element: HTMLElement) => {
      if (isInConfigure) {
        newVisualizerExtraDisplay = element;
      } else {
        this.setState({ visualizerExtraDisplay: element });
      }
    };
    this.controllerState.reset();
    const runner = new VisualizationRunner({
      visualizationName,
      scene,
      audioSource,
      setVisualizerExtraDisplay,
      controllerState: this.controllerState
    });
    runner.hardwareLedSender = new FadecandyLedSender(this.fadecandyClient, scene.leds);
    const values = {
      visualizationRunner: runner,
      visualizationName: visualizationName,
      scene: scene,
      audioSource: audioSource,
      visualizerExtraDisplay: newVisualizerExtraDisplay
    };
    isInConfigure = false;
    if (!doNotSetState) {
      this.setState(values);
    }
    return values;
  }

  private actionManager: AllActions = {
    playMusic: this.handlePlayMusic,
    stopMusic: this.handleStopMusic,
    setMidiInput: this.setMidiInput,
    setMidiControllerInput: this.setMidiControllerInput,
    setMidiOutput: this.setMidiOutput,
    setSelectedMidiFilename: this.loadMidiFile,
    setSelectedSceneName: (name: string) => {
      if (name !== this.state.scene.name) {
        const scene = Scenes.getScene(name);
        this.configureVisualization(this.state.visualizationName, scene, this.state.audioSource);
        SimulatorStickySettings.set("sceneName", name);
      }
    },
    setSelectedVisualizationName: (newValue: Visualizations.Name) => {
      if (this.state.visualizationName !== newValue) {
        this.configureVisualization(newValue, this.state.scene, this.state.audioSource);
        SimulatorStickySettings.set("visualizationName", newValue);
      }
    },
    setAnalogInputId: (newValue: string | null) => {
      this.setState({ selectedAnalogInputId: newValue });
      this.analogAudio.setCurrentDeviceId(newValue);
      SimulatorStickySettings.set("analogAudioSourceId", newValue);
    },
    setBeatControllerType: (newValue: RightSidebar.BeatControllerType) => {
      this.setState({
        beatController: this.createBeatControllerType(newValue)
      });
      SimulatorStickySettings.set("beatControllerType", newValue);

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

  private onMidiControllerInputMessage = (message: WebMidi.MIDIMessageEvent) => {
    const event = new MidiEvent(message.data);
    this.midiControllerEventEmitter.fire(event);
    this.controllerState.handleEvent(event);
    this.updateControlsView();
  }

  private resetAllKeys = () => {
    this.midiEventEmitter.reset();
    PianoHelpers.resetAllKeysMidiDatas().forEach(data => {
      this.midiEventEmitter.fire(new MidiEvent(data, /*suppressDisplay=*/true));
    });
  }

  private myMidiListener: MidiEventListener = {
    onMidiEvent: (event: MidiEvent) => {
      const pianoEvent = event.pianoEvent;
      if (pianoEvent !== null) {
        this.state.visualizationRunner.onPianoEvent(pianoEvent);
      }
    }
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

      const { frameHeatmapValues, frameTimeseriesPoints } = this.state.visualizationRunner.renderFrame(this.state.beatController);
      ++this.framesRenderedSinceLastTimingsCall;

      if (this.analogAudioViewRef) {
        this.analogAudioViewRef.displayFrequencyData(frameHeatmapValues, frameTimeseriesPoints);
      }
    }
  }

  private getTimings = () => {
    const fadecandyLedSender = this.state.visualizationRunner.hardwareLedSender;
    const result = {
      visualizationMillis: this.state.visualizationRunner.averageRenderTime,
      fadeCandyMillis: (fadecandyLedSender === undefined ? 0 : fadecandyLedSender.averageSendTime),
      renderMillis: (this.state.simulationEnabled ? this.renderTimingHelper.movingAverage : 0),
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

  private controlsViewRef: ControlsView | null = null;
  private setControlsViewRef = (newRef: ControlsView | null) => this.controlsViewRef = newRef;
  private updateControlsView = () => {
    if (this.controlsViewRef !== null) {
      this.controlsViewRef.onStateChange();
    }
  }

  private initialVisualizationName(): Visualizations.Name {
    return SimulatorStickySettings.get({
      key: "visualizationName",
      defaultValue: Visualizations.defaultName,
      validateFunc: Visualizations.isValidName
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

  private initialSimulationEnabled(): boolean {
    if (window.location.search === "?disableSimulation") {
      return false;
    } else {
      return SimulatorStickySettings.get({
        key: "simulationEnabled",
        defaultValue: true
      });
    }
  }

  private initialBeatController(): BeatController {
    const type = SimulatorStickySettings.get({
      key: "beatControllerType",
      defaultValue: "manual"
    });
    return this.createBeatControllerType(type);
  }

  public state = ((): State => {
    const scene = this.initialScene();
    return {
      ...this.configureVisualization(
        this.initialVisualizationName(),
        scene,
        /*audioSource=*/null,
        /*doNotSetState=*/true
      ),
      midiState: {
        status: "initializing"
      },
      midiInput: null,
      midiControllerInput: null,
      midiOutput: null,
      midiFilename: "<<not assigned>>",
      midiData: null,
      midiInputs: [],
      midiOutputs: [],
      analogInputs: undefined,
      selectedAnalogInputId: null,
      audioSource: null,
      simulationEnabled: this.initialSimulationEnabled(),
      beatController: this.initialBeatController()
    };
  })();
}

export default App;
