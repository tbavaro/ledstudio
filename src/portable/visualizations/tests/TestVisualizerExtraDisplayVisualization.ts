import * as Visualization from "../../base/Visualization";

const GROUP_NAME = "tests";
const NAME = "testVisualizerExtraDisplay";

class TestVisualizerExtraDisplayVisualization extends Visualization.default {
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

const factory = new Visualization.Factory({ groupName: GROUP_NAME, name: NAME, ctor: TestVisualizerExtraDisplayVisualization });
export default factory;
