import FadecandyLedSender from "./hardware/FadecandyLedSender";
import BeatController from "./portable/base/BeatController";
import * as Colors from "./portable/base/Colors";
import ControllerState from "./portable/base/ControllerState";
import FixedArray from "./portable/base/FixedArray";
import PianoEvent from "./portable/base/PianoEvent";
import * as Visualization from "./portable/base/Visualization";
import * as PianoHelpers from "./portable/PianoHelpers";
import { SendableLedStrip } from "./portable/SendableLedStrip";
import { VisualizationRegistry } from "./portable/VisualizationRegistry";
import { SignalsHelper } from "./portable/visualizationUtils/SignalsHelper";
import Scene from "./scenes/Scene";
import { MovingAverageHelper, bracket, valueOrDefault } from "./util/Utils";

class MyFrameContext implements Visualization.FrameContext {
  public elapsedMillis: number;
  public elapsedSeconds: number;
  public pianoState: PianoHelpers.VisualizationStateHelper;
  public frameHeatmapValues: number[] | undefined;
  public beatController: BeatController;

  constructor() {
    const UNSET = "<unset>" as any;
    this.elapsedMillis = UNSET;
    this.elapsedSeconds = UNSET;
    this.beatController = UNSET;
    this.pianoState = new PianoHelpers.VisualizationStateHelper();
  }

  public setFrameHeatmapValues(values: number[]) {
    if (this.frameHeatmapValues === undefined) {
      this.frameHeatmapValues = values;
    } else {
      throw new Error("frame heatmap values set multiple times");
    }
  }

  public startFrame() {
    this.pianoState.startFrame();
  }

  public endFrame(elapsedSeconds: number, beatController: BeatController) {
    this.elapsedMillis = elapsedSeconds * 1000;
    this.elapsedSeconds = elapsedSeconds;
    this.pianoState.endFrame();
    this.frameHeatmapValues = undefined;
    this.beatController = beatController;
  }

  public applyPianoEvent(event: PianoEvent) {
    this.pianoState.applyEvent(event);
  }
}

const DEFAULT_COLOR_ORDER = [
  Colors.WHITE,
  Colors.BLUE,
  Colors.RED,
  Colors.YELLOW,
  Colors.GREEN,
  Colors.ORANGE,
  Colors.CYAN,
  Colors.PURPLE,
  Colors.CHARTREUSE
];

class TimeSeriesHelper {
  private usedColors: Colors.Color[] = [];
  public data: Visualization.TimeSeriesValue[] = [];

  public createTimeSeries = (attrs?: { color?: Colors.Color }) => {
    attrs = attrs || {};

    let color: Colors.Color;
    if (attrs.color === undefined) {
      color = this.nextDefaultColor();
    } else {
      color = attrs.color;
    }
    this.usedColors.push(color);

    const data = new Visualization.TimeSeriesValue(color);
    this.data.push(data);

    return data;
  };

  private nextDefaultColor(): Colors.Color {
    const color = DEFAULT_COLOR_ORDER.find(c => !this.usedColors.includes(c));
    if (color === undefined) {
      throw new Error("all default colors were used");
    }
    return color;
  }

  public reset() {
    this.usedColors = [];
    this.data = [];
  }
}

class MyDialControl implements Visualization.DialControl {
  private readonly controllerState: ControllerState;
  private readonly index: number;
  private readonly minValue: number;
  private readonly maxValue: number;

  constructor(attrs: {
    controllerState: ControllerState;
    dialNumber: number;
    minValue: number;
    maxValue: number;
  }) {
    const { dialNumber, controllerState } = attrs;
    this.controllerState = controllerState;
    this.index = dialNumber - 1;
    if (
      this.index < 0 ||
      this.index >= this.controllerState.dialValues.length
    ) {
      throw new Error("invalid dial number: " + attrs.dialNumber);
    }
    this.minValue = attrs.minValue;
    this.maxValue = attrs.maxValue;
  }

  public get value() {
    return (
      this.controllerState.dialValues[this.index] *
        (this.maxValue - this.minValue) +
      this.minValue
    );
  }

  public set value(value: number) {
    value = bracket(this.minValue, this.maxValue, value);
    this.controllerState.dialValues[this.index] =
      (value - this.minValue) / (this.maxValue - this.minValue);
  }
}

class MyButtonControl implements Visualization.ButtonControl {
  private readonly controllerState: ControllerState;
  private readonly index: number;

  constructor(attrs: {
    controllerState: ControllerState;
    buttonNumber: number;
  }) {
    const { buttonNumber, controllerState } = attrs;
    this.controllerState = controllerState;
    this.index = buttonNumber - 1;
    if (
      this.index < 0 ||
      this.index >= this.controllerState.buttonStates.length
    ) {
      throw new Error("invalid button number: " + attrs.buttonNumber);
    }
  }

  public get value() {
    return this.controllerState.buttonStates[this.index];
  }

  public get pressedSinceLastFrame() {
    if (this.controllerState.pressesSinceLastFrame.length > 0) {
      console.log(this.controllerState.pressesSinceLastFrame);
    }
    return this.controllerState.pressesSinceLastFrame.includes(this.index);
  }

  public get releasedSinceLastFrame() {
    return this.controllerState.releasesSinceLastFrame.includes(this.index);
  }
}

const ASSIGNABLE_DIAL_NUMBERS = [1, 2, 3, 4, 5, 6, 7];
const ASSIGNABLE_BUTTON_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8];

class ControllerStateHelper {
  private readonly controllerState: ControllerState;
  private readonly forceUpdateUI: () => void;
  private usedDialNumbers: number[];
  private usedButtonNumbers: number[];

  constructor(controllerState: ControllerState, forceUpdateUI: () => void) {
    this.controllerState = controllerState;
    this.usedButtonNumbers = [];
    this.usedDialNumbers = [];
    this.forceUpdateUI = forceUpdateUI;
  }

  public reset() {
    this.usedButtonNumbers = [];
    this.usedDialNumbers = [];
  }

  public createDialControl = (attrs?: {
    dialNumber?: number;
    initialValue?: number;
    minValue?: number;
    maxValue?: number;
  }): Visualization.DialControl => {
    attrs = attrs || {};

    let dialNumber: number;
    if (attrs.dialNumber === undefined) {
      dialNumber = this.nextDialNumber();
    } else {
      dialNumber = attrs.dialNumber;
    }
    this.usedDialNumbers.push(dialNumber);

    const minValue = valueOrDefault(attrs.minValue, 0);
    const maxValue = valueOrDefault(attrs.maxValue, 1);
    if (maxValue <= minValue) {
      throw new Error("dial minValue must be less than maxValue");
    }

    const helper = new MyDialControl({
      controllerState: this.controllerState,
      dialNumber: dialNumber,
      minValue: minValue,
      maxValue: maxValue
    });

    helper.value = valueOrDefault(attrs.initialValue, minValue);

    this.forceUpdateUI();

    return helper;
  };

  private nextDialNumber(): number {
    const dialNumber = ASSIGNABLE_DIAL_NUMBERS.find(
      n => !this.usedDialNumbers.includes(n)
    );
    if (dialNumber === undefined) {
      throw new Error("all dials were used");
    }
    return dialNumber;
  }

  public createButtonControl = (attrs?: {
    buttonNumber?: number;
  }): Visualization.ButtonControl => {
    attrs = attrs || {};

    let buttonNumber: number;
    if (attrs.buttonNumber === undefined) {
      buttonNumber = this.nextButtonNumber();
    } else {
      buttonNumber = attrs.buttonNumber;
    }
    this.usedButtonNumbers.push(buttonNumber);

    return new MyButtonControl({
      controllerState: this.controllerState,
      buttonNumber: buttonNumber
    });
  };

  private nextButtonNumber(): number {
    const buttonNumber = ASSIGNABLE_BUTTON_NUMBERS.find(
      n => !this.usedButtonNumbers.includes(n)
    );
    if (buttonNumber === undefined) {
      throw new Error("all buttons were used");
    }
    return buttonNumber;
  }
}

export default class VisualizationRunner {
  public readonly visualization: Visualization.default;
  private readonly timingHelper: MovingAverageHelper;
  private lastRenderTime: number = 0;
  public hardwareLedSender?: FadecandyLedSender;
  public simulationLedStrip?: SendableLedStrip;
  private adjustedLeds: FixedArray<Colors.Color>;
  private readonly frameContext: MyFrameContext;
  private readonly timeSeriesHelper: TimeSeriesHelper;
  private readonly brightnessDial: Visualization.DialControl;
  private readonly derezDial: Visualization.DialControl;
  private readonly controllerState: ControllerState;
  private readonly signalsHelper: SignalsHelper;

  constructor(attrs: {
    visualizationRegistry: VisualizationRegistry;
    visualizationName: string;
    scene: Scene;
    audioSource: AudioNode;
    setVisualizerExtraDisplay: (element: HTMLElement | null) => void;
    controllerState: ControllerState;
    forceUpdateUI: () => void;
  }) {
    this.timeSeriesHelper = new TimeSeriesHelper();
    this.controllerState = attrs.controllerState;
    const controllerStateHelper = new ControllerStateHelper(
      attrs.controllerState,
      attrs.forceUpdateUI
    );
    this.brightnessDial = controllerStateHelper.createDialControl({
      dialNumber: 8,
      initialValue: attrs.controllerState.dialValues[7]
    });
    this.derezDial = controllerStateHelper.createDialControl({
      dialNumber: 7,
      initialValue: attrs.controllerState.dialValues[6]
    });
    this.signalsHelper = new SignalsHelper(attrs.audioSource);
    const visualizationConfig: Visualization.Config = {
      scene: attrs.scene,
      audioSource: attrs.audioSource,
      signals: this.signalsHelper,
      setExtraDisplay: attrs.setVisualizerExtraDisplay,
      createTimeSeries: this.timeSeriesHelper.createTimeSeries,
      createButtonControl: controllerStateHelper.createButtonControl,
      createDialControl: controllerStateHelper.createDialControl,
      createEasyTimeSeriesSet: () => {
        return {
          white: this.timeSeriesHelper.createTimeSeries({
            color: Colors.WHITE
          }),
          blue: this.timeSeriesHelper.createTimeSeries({ color: Colors.BLUE }),
          red: this.timeSeriesHelper.createTimeSeries({ color: Colors.RED }),
          yellow: this.timeSeriesHelper.createTimeSeries({
            color: Colors.YELLOW
          }),
          green: this.timeSeriesHelper.createTimeSeries({
            color: Colors.GREEN
          }),
          orange: this.timeSeriesHelper.createTimeSeries({
            color: Colors.ORANGE
          })
        };
      },
      reset: () => {
        this.timeSeriesHelper.reset();
        controllerStateHelper.reset();
        this.controllerState.reset();
        attrs.setVisualizerExtraDisplay(null);
      }
    };
    this.visualization = attrs.visualizationRegistry.createVisualization(
      attrs.visualizationName,
      visualizationConfig
    );
    this.timingHelper = new MovingAverageHelper(20);
    this.adjustedLeds = this.visualization.ledColors.map(_ => Colors.BLACK);
    this.frameContext = new MyFrameContext();
  }

  public renderFrame(beatController: BeatController) {
    const startTime = performance.now();
    if (this.lastRenderTime === 0) {
      this.lastRenderTime = startTime - 1000 / 60;
    }

    // collect state
    const elapsedSeconds = (startTime - this.lastRenderTime) / 1000;
    this.frameContext.endFrame(elapsedSeconds, beatController);

    // render into the LED strip
    this.signalsHelper.update(elapsedSeconds * 1000, beatController);
    this.visualization.render(this.frameContext);
    const frameHeatmapValues = this.frameContext.frameHeatmapValues || [];

    this.controllerState.startFrame();
    this.frameContext.startFrame();
    this.lastRenderTime = startTime;

    // timing
    const visTimeMillis = performance.now() - startTime;
    this.timingHelper.addValue(visTimeMillis);

    // send
    this.sendToStrips(this.brightnessDial.value, this.derezDial.value);

    return {
      frameHeatmapValues: frameHeatmapValues,
      frameTimeseriesPoints: this.timeSeriesHelper.data
    };
  }

  public onPianoEvent(event: PianoEvent) {
    this.frameContext.applyPianoEvent(event);
  }

  public get averageRenderTime() {
    return this.timingHelper.movingAverage;
  }

  private sendToStrips(multiplier: number, derez: number) {
    this.visualization.ledColors.forEach((color, i) => {
      if (Math.random() > derez) {
        this.adjustedLeds.set(i, Colors.multiply(color, multiplier));
      }
    });

    if (this.simulationLedStrip !== undefined) {
      const strip = this.simulationLedStrip;
      this.adjustedLeds.forEach((color, i) => strip.setColor(i, color));
      strip.send();
    }

    if (this.hardwareLedSender !== undefined) {
      this.hardwareLedSender.send(this.adjustedLeds);
    }
  }
}
