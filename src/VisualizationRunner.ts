import * as Colors from "./portable/base/Colors";
import ControllerState from "./portable/base/ControllerState";
import FixedArray from "./portable/base/FixedArray";
import PianoEvent from "./portable/base/PianoEvent";
import * as TimeseriesData from "./portable/base/TimeseriesData";
import * as Visualization from "./portable/base/Visualization";

import * as PianoHelpers from "./portable/PianoHelpers";
import { SendableLedStrip } from "./portable/SendableLedStrip";
import * as Visualizations from "./portable/Visualizations";

import { bracket, MovingAverageHelper, removeFirst, valueOrDefault } from "./util/Utils";

import FadecandyLedSender from "./hardware/FadecandyLedSender";
import Scene from "./scenes/Scene";

class MyFrameContext implements Visualization.FrameContext {
  public elapsedMillis: number;
  public pianoState: PianoHelpers.VisualizationStateHelper;
  public frameHeatmapValues: number[] | undefined;

  constructor() {
    const UNSET = "<unset>" as any;
    this.elapsedMillis = UNSET;
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

  public endFrame(elapsedMillis: number) {
    this.elapsedMillis = elapsedMillis;
    this.pianoState.endFrame();
    this.frameHeatmapValues = undefined;
  }

  public applyPianoEvent(event: PianoEvent) {
    this.pianoState.applyEvent(event);
  }
}

class MyTimeSeriesValueSetter implements Visualization.TimeSeriesValueSetter {
  public readonly data: TimeseriesData.PointDef;

  constructor(color: Colors.Color) {
    this.data = {
      color: color,
      value: null
    };
  }

  public reset() {
    this.set(null);
  }

  public set(value: number | null) {
    this.data.value = value;
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
  private readonly remainingDefaultColors = [...DEFAULT_COLOR_ORDER].reverse();
  public readonly data: TimeseriesData.PointDef[] = [];
  private readonly setters: MyTimeSeriesValueSetter[] = [];

  public createTimeSeries = (attrs?: {
    color?: Colors.Color
  }) => {
    attrs = attrs || {};

    let color: Colors.Color;
    if (attrs.color === undefined) {
      color = this.nextDefaultColor();
    } else {
      color = attrs.color;
      removeFirst(this.remainingDefaultColors, attrs.color);
    }

    const setter = new MyTimeSeriesValueSetter(color);
    this.data.push(setter.data);
    this.setters.push(setter);

    return setter;
  }

  private nextDefaultColor(): Colors.Color {
    const color = this.remainingDefaultColors.pop();
    if (color === undefined) {
      throw new Error("all default colors were used");
    }
    return color;
  }

  public resetAll() {
    this.setters.forEach(s => s.reset());
  }
}

class MyControllerDialValueGetter implements Visualization.ControllerDialValueGetter {
  private readonly controllerState: ControllerState;
  private readonly index: number;
  private readonly minValue: number;
  private readonly maxValue: number;

  constructor(attrs: {
    controllerState: ControllerState,
    dialNumber: number,
    minValue: number,
    maxValue: number
  }) {
    const { dialNumber, controllerState } = attrs;
    this.controllerState = controllerState;
    this.index = dialNumber - 1;
    if (this.index < 0 || this.index >= this.controllerState.dialValues.length) {
      throw new Error("invalid dial number: " + attrs.dialNumber);
    }
    this.minValue = attrs.minValue;
    this.maxValue = attrs.maxValue;
  }

  public get() {
    return this.controllerState.dialValues[this.index] * (this.maxValue - this.minValue) + this.minValue;
  }

  public set(value: number) {
    value = bracket(this.minValue, this.maxValue, value);
    this.controllerState.dialValues[this.index] = (value - this.minValue) / (this.maxValue - this.minValue);
  }
}

class MyControllerButtonStateGetter implements Visualization.ControllerButtonStateGetter {
  private readonly controllerState: ControllerState;
  private readonly index: number;

  constructor(attrs: {
    controllerState: ControllerState,
    buttonNumber: number
  }) {
    const { buttonNumber, controllerState } = attrs;
    this.controllerState = controllerState;
    this.index = buttonNumber - 1;
    if (this.index < 0 || this.index >= this.controllerState.buttonStates.length) {
      throw new Error("invalid button number: " + attrs.buttonNumber);
    }
  }

  public get() {
    return this.controllerState.buttonStates[this.index];
  }
}

class ControllerStateHelper {
  private readonly controllerState: ControllerState;
  private readonly unusedDialNumbers: number[];
  private readonly unusedButtonNumbers: number[];

  constructor(controllerState: ControllerState) {
    this.controllerState = controllerState;
    this.unusedDialNumbers = [1, 2, 3, 4, 5, 6, 7].reverse();
    this.unusedButtonNumbers = [1, 2, 3, 4, 5, 6, 7, 8].reverse();
  }

  public createDialControl = (attrs?: {
    dialNumber?: number;
    initialValue?: number;
    minValue?: number;
    maxValue?: number;
  }): Visualization.ControllerDialValueGetter => {
    attrs = attrs || {};

    let dialNumber: number;
    if (attrs.dialNumber === undefined) {
      dialNumber = this.nextDialNumber();
    } else {
      dialNumber = attrs.dialNumber;
      removeFirst(this.unusedDialNumbers, dialNumber);
    }

    const minValue = valueOrDefault(attrs.minValue, 0);
    const maxValue = valueOrDefault(attrs.maxValue, 1);
    if (maxValue <= minValue) {
      throw new Error("dial minValue must be less than maxValue");
    }

    const helper = new MyControllerDialValueGetter({
      controllerState: this.controllerState,
      dialNumber: dialNumber,
      minValue: minValue,
      maxValue: maxValue
    });

    helper.set(valueOrDefault(attrs.initialValue, minValue));

    return helper;
  }

  private nextDialNumber(): number {
    const dialNumber = this.unusedDialNumbers.pop();
    if (dialNumber === undefined) {
      throw new Error("all dials were used");
    }
    return dialNumber;
  }

  public createButtonControl = (attrs?: {
    buttonNumber?: number;
  }): Visualization.ControllerButtonStateGetter => {
    attrs = attrs || {};

    let buttonNumber: number;
    if (attrs.buttonNumber === undefined) {
      buttonNumber = this.nextButtonNumber();
    } else {
      buttonNumber = attrs.buttonNumber;
      removeFirst(this.unusedButtonNumbers, buttonNumber);
    }

    return new MyControllerButtonStateGetter({
      controllerState: this.controllerState,
      buttonNumber: buttonNumber
    });
  }

  private nextButtonNumber(): number {
    const buttonNumber = this.unusedButtonNumbers.pop();
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
  private adjustedLedRows: FixedArray<FixedArray<Colors.Color>>;
  private readonly frameContext: MyFrameContext;
  private readonly timeSeriesHelper: TimeSeriesHelper;
  private readonly brightnessDial: Visualization.ControllerDialValueGetter;

  constructor(attrs: {
    visualizationName: Visualizations.Name,
    scene: Scene,
    audioSource: AudioNode | null,
    setVisualizerExtraDisplay: (element: HTMLElement) => void,
    controllerState: ControllerState
  }) {
    this.timeSeriesHelper = new TimeSeriesHelper();
    const controllerStateHelper = new ControllerStateHelper(attrs.controllerState);
    this.brightnessDial = controllerStateHelper.createDialControl({
      dialNumber: 8,
      initialValue: attrs.controllerState.dialValues[7]
    });
    const visualizationConfig: Visualization.Config = {
      scene: attrs.scene,
      audioSource: attrs.audioSource,
      setExtraDisplay: attrs.setVisualizerExtraDisplay,
      createTimeSeries: this.timeSeriesHelper.createTimeSeries,
      createButtonControl: controllerStateHelper.createButtonControl,
      createDialControl: controllerStateHelper.createDialControl
    };
    this.visualization = Visualizations.create(attrs.visualizationName, visualizationConfig);
    this.timingHelper = new MovingAverageHelper(20);
    this.adjustedLedRows = this.visualization.ledRows.map(row => row.map(_ => Colors.BLACK));
    this.frameContext = new MyFrameContext();
  }

  public renderFrame() {
    const startTime = performance.now();
    if (this.lastRenderTime === 0) {
      this.lastRenderTime = startTime - 1000 / 60;
    }

    // collect state
    this.timeSeriesHelper.resetAll();
    this.frameContext.endFrame(startTime - this.lastRenderTime);

    // render into the LED strip
    this.visualization.render(this.frameContext);
    const frameHeatmapValues = this.frameContext.frameHeatmapValues || [];

    this.frameContext.startFrame();
    this.lastRenderTime = startTime;

    // timing
    const visTimeMillis = performance.now() - startTime;
    this.timingHelper.addValue(visTimeMillis);

    // send
    this.sendToStrips(this.brightnessDial.get());

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

  private sendToStrips(multiplier: number) {
    this.visualization.ledRows.forEach((row, rowIdx) => {
      const outputRow = this.adjustedLedRows.get(rowIdx);
      row.forEach((color, i) => {
        outputRow.set(i, Colors.multiply(color, multiplier));
      });
    });

    if (this.simulationLedStrip !== undefined) {
      const strip = this.simulationLedStrip;
      let i = 0;
      this.adjustedLedRows.forEach(row => {
        row.forEach(color => {
          strip.setColor(i++, color);
        });
      });
      strip.send();
    }

    if (this.hardwareLedSender !== undefined) {
      this.hardwareLedSender.send(this.adjustedLedRows);
    }
  }
}
