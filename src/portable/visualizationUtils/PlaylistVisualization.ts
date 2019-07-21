import * as Visualization from "../base/Visualization";

function branchAudioNode(audioNode: AudioNode) {
  const newNode = new GainNode(audioNode.context);
  audioNode.connect(newNode);
  return newNode;
}

const BASE_TRANSITION_TIME_MS = 5000;

export interface PlaylistEntry {
  name: string;
  factory: Visualization.Factory;
  duration: number;
}

export class PlaylistVisualization extends Visualization.default {
  private readonly entries: PlaylistEntry[];
  private lastVisualization: Visualization.default | null = null;
  private currentVisualization: Visualization.default;
  private currentVisualizationIndex: number;
  private currentBranchedAudioNode: AudioNode;
  private timeAtSwitch: number;
  private secondsUntilSwitch: number;
  private button: Visualization.ButtonControl;

  constructor(config: Visualization.Config, attrs: {
    visualizations: PlaylistEntry[];
  }) {
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
    labelElement.innerText = entry.name;
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

    const vis = entry.factory.create(newConfig);
    this.lastVisualization = this.currentVisualization;
    this.currentVisualization = vis;
    this.timeAtSwitch = Date.now();
    this.secondsUntilSwitch = entry.duration;

    console.log("switched to", vis);
  }

  private goToNextVisualization() {
    this.switchToVisualization((this.currentVisualizationIndex + 1) % this.entries.length);
  }

  public render(context: Visualization.FrameContext) {
    this.secondsUntilSwitch -= context.elapsedSeconds;
    const shouldSwitch = (this.secondsUntilSwitch < 0 || this.button.pressedSinceLastFrame);
    if (shouldSwitch) {
      this.goToNextVisualization();
    }

    const now = Date.now();
    if (now - this.timeAtSwitch > BASE_TRANSITION_TIME_MS) {
      this.lastVisualization = null;
    }

    const vis = this.currentVisualization;
    vis.render(context);
    vis.ledRows.forEach((row, idx) => row.copy(this.ledRows.get(idx)));

    if (this.lastVisualization != null) {
      this.lastVisualization.render(context);
      const alpha = (now - this.timeAtSwitch) / BASE_TRANSITION_TIME_MS;
      for (let rowIdx = 0; rowIdx < this.ledRows.length; ++rowIdx) {
        const sourceRow = this.lastVisualization.ledRows.get(rowIdx);
        const destRow = this.ledRows.get(rowIdx);
        for (let ledIdx = 0; ledIdx < sourceRow.length; ++ledIdx) {
          // tslint:disable-next-line:no-bitwise
          const hash = (((rowIdx * 401057)| (ledIdx * 801571)) % 1000) / 1000.0;
          const color = sourceRow.get(ledIdx);
          if (alpha < hash) {
            destRow.set(ledIdx, color);
          }
        }
      }
    }
  }
}
