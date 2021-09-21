import * as Visualization from "../base/Visualization";

function branchAudioNode(audioNode?: AudioNode) {
  if (audioNode === undefined) {
    return undefined;
  } else {
    const newNode = new GainNode(audioNode.context);
    audioNode.connect(newNode);
    return newNode;
  }
}

const BASE_TRANSITION_TIME_MS = 5000;

export interface PlaylistEntry {
  displayName: string;
  visualization: Visualization.Constructor;
  duration: number;
}

export class PlaylistVisualization extends Visualization.default {
  private readonly entries: PlaylistEntry[];
  private lastVisualization?: Visualization.default;
  private currentVisualization?: Visualization.default;
  private currentVisualizationIndex: number = 0;
  private currentBranchedAudioNode?: AudioNode;
  private timeAtSwitch: number = 0;
  private secondsUntilSwitch: number = 0;
  private button?: Visualization.ButtonControl;

  constructor(
    config: Visualization.Config,
    attrs: {
      visualizations: PlaylistEntry[];
    }
  ) {
    super(config);
    this.entries = attrs.visualizations;

    if (this.entries.length < 1) {
      throw new Error("must have at least 1 visualization");
    }

    this.switchToVisualization(0);
  }

  private switchToVisualization(n: number) {
    this.currentVisualizationIndex = n;
    const entry = this.entries[n];

    if (this.currentBranchedAudioNode !== undefined) {
      this.currentBranchedAudioNode.disconnect();
    }

    if (this.config.audioSource !== null) {
      this.currentBranchedAudioNode = branchAudioNode(this.config.audioSource);
    }

    this.config.reset();

    const element = document.createElement("div");
    const labelElement = document.createElement("div");
    labelElement.innerText = entry.displayName;
    labelElement.style.backgroundColor = "gray";
    labelElement.style.color = "white";
    labelElement.style.fontSize = "12px";
    labelElement.style.padding = "5px";
    element.appendChild(labelElement);
    const containerElement = document.createElement("div");
    element.appendChild(containerElement);
    this.config.setExtraDisplay(element);

    this.button = this.config.createButtonControl({ buttonNumber: 5 });
    const newConfig: Visualization.Config = {
      ...this.config,
      setExtraDisplay: (newElement: HTMLElement | null) => {
        containerElement.innerHTML = "";
        if (newElement !== null) {
          containerElement.appendChild(newElement);
        }
      },
      audioSource: this.currentBranchedAudioNode
    };

    const vis = new entry.visualization(newConfig);
    this.lastVisualization = this.currentVisualization;
    this.currentVisualization = vis;
    this.timeAtSwitch = Date.now();
    this.secondsUntilSwitch = entry.duration;
  }

  private goToNextVisualization() {
    this.switchToVisualization(
      (this.currentVisualizationIndex + 1) % this.entries.length
    );
  }

  public render(context: Visualization.FrameContext) {
    this.secondsUntilSwitch -= context.elapsedSeconds;
    const shouldSwitch =
      this.secondsUntilSwitch < 0 ||
      (this.button && this.button.pressedSinceLastFrame);
    if (shouldSwitch) {
      this.goToNextVisualization();
    }

    const now = Date.now();
    if (now - this.timeAtSwitch > BASE_TRANSITION_TIME_MS) {
      this.lastVisualization = undefined;
    }

    const vis = this.currentVisualization;
    if (vis !== undefined) {
      vis.render(context);
      vis.ledColors.copy(this.ledColors);
    }

    if (this.lastVisualization !== undefined) {
      this.lastVisualization.render(context);
      const alpha = (now - this.timeAtSwitch) / BASE_TRANSITION_TIME_MS;
      this.lastVisualization.ledColors.forEach((color, ledIdx) => {
        // tslint:disable-next-line:no-bitwise
        const hash = ((ledIdx * 801571) % 1000) / 1000.0;
        if (alpha < hash) {
          this.ledColors.set(ledIdx, color);
        }
      });
    }
  }
}
