import * as React from "react";

import ManualBeatController from "./beat/ManualBeatController";

import BeatController from "./portable/base/BeatController";
import ControllerState from "./portable/base/ControllerState";

import * as PianoHelpers from "./portable/PianoHelpers";

import { firstKey, MovingAverageHelper, valueOrThrow } from "./util/Utils";

import FadecandyClient from "./hardware/FadecandyClient";
import FadecandyLedSender from "./hardware/FadecandyLedSender";

import Scene from "./scenes/Scene";

import SimulationViewport from "./simulator/SimulationViewport";
import * as SimulatorStickySettings from "./simulator/SimulatorStickySettings";
import VisualizerExtraDisplayContainer from "./simulator/VisualizerExtraDisplayContainer";

import MidiEvent from "./piano/MidiEvent";
import MidiEventListener, { MidiEventEmitter, QueuedMidiEventEmitter } from "./piano/MidiEventListener";

import * as AudioIn from "./audioIn/AudioIn";
import AudioInView from "./audioIn/AudioInView";

import BeatControlView from "./BeatControlView";
import ControlsView from "./ControlsView";
import PianoView from "./PianoView";
import * as RightSidebar from "./RightSidebar";
import TimingStatsView from "./TimingStatsView";
import VisualizationRunner from "./VisualizationRunner";

import "./LedStudioRoot.css";

import AbletonLinkConnect from "./beat/AbletonLinkConnect";
import * as Visualization from "./portable/base/Visualization";

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

interface Props {
  scenes: Map<string, Scene>;
  visualizations: Map<string, Visualization.Factory>;
}

interface InnerProps extends Props {
  sceneNames: string[];
  visualizationNames: string[];
}

interface State {
  scene: Scene;
  visualizationName: string;
  visualizationRunner: VisualizationRunner;
  midiState: Readonly<MidiState>;
  midiInput: WebMidi.MIDIInput | null;
  midiControllerInput: WebMidi.MIDIInput | null;
  midiOutput: WebMidi.MIDIOutput | null;
  midiInputs: WebMidi.MIDIInput[];
  midiOutputs: WebMidi.MIDIOutput[];
  audioInputs: AudioIn.InputDeviceInfo[] | undefined;
  selectedAudioInputId: string | null;
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

function createDummyAudioNode() {
  const ctx = new AudioContext();
  return ctx.createGain();
}

class LedStudioRoot extends React.Component<InnerProps, State> {
  private readonly midiEventEmitter = new QueuedMidiEventEmitter();
  private readonly midiControllerEventEmitter = new MidiEventEmitter();
  private readonly fadecandyClient = new FadecandyClient();
  public readonly audioIn = new AudioIn.default((newAudioSource: AudioNode | null) => {
    this.configureVisualization(this.state.visualizationName, this.state.scene, newAudioSource);
  });
  private readonly controllerState = new ControllerState();

  public componentWillMount() {
    if (super.componentWillMount) {
      super.componentWillMount();
    }

    this.audioIn.addEventListener("deviceListChanged", this.updateAudioInDevices);

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

    const { midiState } = this.state;
    if (midiState.status === "loaded") {
      midiState.webMidi.removeEventListener("statechange", this.updateMidiDevices);
    }
    this.midiEventEmitter.removeListener(this.myMidiListener);

    this.audioIn.removeEventListener("deviceListChanged", this.updateAudioInDevices);
  }

  public render() {
    return (
      <div className="LedStudioRoot">
        <div className="LedStudioRoot-viewportGroup">
          <div className="LedStudioRoot-viewportContainer">
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
          <div className="LedStudioRoot-audioInViewContainer">
            <AudioInView ref={this.setAudioInViewRef}/>
          </div>
          <div className="LedStudioRoot-controllerStateContainer">
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
        <div className="LedStudioRoot-sidebarContainer">
          {this.renderSidebarContents()}
        </div>
      </div>
    );
  }

  private renderSimulationToggleSwitch() {
    return (
      <div
        className={"LedStudioRoot-simulationToggleSwitch" + (this.state.simulationEnabled ? " enabled" : "")}
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
            sceneNames={this.props.sceneNames}
            selectedSceneName={this.state.scene.name}
            visualizationNames={this.props.visualizationNames}
            selectedVisualizationName={this.state.visualizationName}
            midiInputs={this.state.midiInputs}
            selectedPianoMidiInput={this.state.midiInput}
            selectedControllerMidiInput={this.state.midiControllerInput}
            midiOutputs={this.state.midiOutputs}
            selectedPianoMidiThru={this.state.midiOutput}
            midiEventEmitters={[this.midiEventEmitter, this.midiControllerEventEmitter]}
            audioInputs={this.state.audioInputs}
            selectedAudioInputId={this.state.selectedAudioInputId}
            selectedBeatControllerType={beatControllerType}
          />
        );

      case "failed":
        return `error: ${this.state.midiState.midiFailureReason}`;
    }
  }

  private getMessage2 = () => this.state.scene.displayMessage;

  private setMidiInput = (newValue: WebMidi.MIDIInput | null) => {
    if (newValue !== this.state.midiInput) {
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
      this.setState({ midiOutput: newValue });
      SimulatorStickySettings.set("midiOutputId", newValue === null ? null : newValue.id);
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
    visualizationName: string,
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
    const visualizationFactory = valueOrThrow(this.props.visualizations.get(visualizationName));
    const runner = new VisualizationRunner({
      visualizationFactory,
      scene,
      audioSource: audioSource || createDummyAudioNode(),
      setVisualizerExtraDisplay,
      controllerState: this.controllerState,
      forceUpdateUI: () => this.forceUpdate()
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
    setPianoMidiInput: this.setMidiInput,
    setControllerMidiInput: this.setMidiControllerInput,
    setPianoMidiThru: this.setMidiOutput,
    setSelectedSceneName: (name: string) => {
      if (name !== this.state.scene.name) {
        const scene = valueOrThrow(this.props.scenes.get(name));
        this.configureVisualization(this.state.visualizationName, scene, this.state.audioSource);
        SimulatorStickySettings.set("sceneName", name);
      }
    },
    setSelectedVisualizationName: (newValue: string) => {
      if (this.state.visualizationName !== newValue) {
        this.configureVisualization(newValue, this.state.scene, this.state.audioSource);
        SimulatorStickySettings.set("visualizationName", newValue);
      }
    },
    setAudioInputId: (newValue: string | null) => {
      this.setState({ selectedAudioInputId: newValue });
      this.audioIn.setCurrentDeviceId(newValue);
      SimulatorStickySettings.set("audioInSourceId", newValue);
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

      if (this.audioInViewRef) {
        this.audioInViewRef.displayFrequencyData(frameHeatmapValues, frameTimeseriesPoints);
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

  private updateAudioInDevices = () => {
    const isInitialization = (this.state.audioInputs === undefined);
    this.setState({
      audioInputs: this.audioIn.inputDevices,
    });

    if (isInitialization) {
      this.actionManager.setAudioInputId(this.initialAudioInDeviceId());
    }
  }

  private audioInViewRef: AudioInView | undefined = undefined;
  private setAudioInViewRef = (newRef: AudioInView) => this.audioInViewRef = newRef;

  private controlsViewRef: ControlsView | null = null;
  private setControlsViewRef = (newRef: ControlsView | null) => this.controlsViewRef = newRef;
  private updateControlsView = () => {
    if (this.controlsViewRef !== null) {
      this.controlsViewRef.onStateChange();
    }
  }

  private initialVisualizationName(): string {
    return SimulatorStickySettings.get({
      key: "visualizationName",
      defaultValue: firstKey(this.props.visualizations),
      validateFunc: v => this.props.visualizations.has(v)
    });
  }

  private initialScene(): Scene {
    const name = SimulatorStickySettings.get({
      key: "sceneName",
      defaultValue: firstKey(this.props.scenes),
      validateFunc: (v: string) => this.props.scenes.has(v)
    });
    return valueOrThrow(this.props.scenes.get(name));
  }

  private initialAudioInDeviceId(): string | null {
    return SimulatorStickySettings.get({
      key: "audioInSourceId",
      defaultValue: this.audioIn.defaultDeviceId,
      validateFunc: this.audioIn.isValidId
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
      midiInputs: [],
      midiOutputs: [],
      audioInputs: undefined,
      selectedAudioInputId: null,
      audioSource: null,
      simulationEnabled: this.initialSimulationEnabled(),
      beatController: this.initialBeatController()
    };
  })();
}

export default class LedStudioRootWrapper extends React.PureComponent<Props, {}> {
  private counter = 0;

  public render() {
    const key = `instance${this.counter++}`;

    if (this.counter > 1) {
      // this isn't actually a horrible situation, but I don't expect it to happen
      throw new Error(`LedStudioRoot has rendered ${this.counter} times`);
    }

    return React.createElement(LedStudioRoot, {
      ...this.props,
      sceneNames: Array.from(this.props.scenes.keys()),
      visualizationNames: Array.from(this.props.visualizations.keys()),
      key
    });
  }
}
