import * as Visualization from "../base/Visualization";

export default class TestVisualizerExtraDisplayVisualization extends Visualization.default {
  private element: HTMLDivElement;
  private totalMillis = 0;

  constructor(config: Visualization.Config) {
    super(config);
    this.element = document.createElement("div");
    this.element.style.fontFamily = "monospace";
    this.element.style.padding = "0.25em";
    this.element.innerText = "(new)";
    config.setExtraDisplay(this.element);
  }

  public render(context: Visualization.FrameContext): void {
    const { elapsedMillis } = context;

    this.totalMillis += elapsedMillis;
    this.element.innerText = `total millis: ${Math.floor(this.totalMillis)}`;
  }
}
