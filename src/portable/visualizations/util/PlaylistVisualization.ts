import * as Visualization from "../../base/Visualization";

export type VisualizationClass = new (config: Visualization.Config) => Visualization.default;

function branchAudioNode(audioNode: AudioNode) {
  const newNode = new GainNode(audioNode.context);
  audioNode.connect(newNode);
  return newNode;
}

export default class PlaylistVisualization extends Visualization.default {
  private readonly visualizations: VisualizationClass[];
  private currentVisualization: Visualization.default;
  private currentVisualizationIndex: number;
  private currentBranchedAudioNode: AudioNode | null = null;
  private millisUntilSwitch: number;
  private button: Visualization.ButtonControl;
  private readonly autoAdvanceMillis: number;

  constructor(config: Visualization.Config, attrs: {
    autoAdvanceMillis: number;
    visualizations: VisualizationClass[];
  }) {
    super(config);
    this.autoAdvanceMillis = attrs.autoAdvanceMillis;
    this.visualizations = attrs.visualizations;

    if (this.visualizations.length < 1) {
      throw new Error("must have at least 1 visualization");
    }

    this.switchToVisualization(0);
  }

  private switchToVisualization(n: number) {
    this.currentVisualizationIndex = n;
    const visClass = this.visualizations[n];

    if (this.currentBranchedAudioNode !== null) {
      this.currentBranchedAudioNode.disconnect();
      this.currentBranchedAudioNode = null;
    }

    if (this.config.audioSource !== null) {
      this.currentBranchedAudioNode = branchAudioNode(this.config.audioSource);
    }

    this.config.reset();
    this.button = this.config.createButtonControl({ buttonNumber: 5 });
    const newConfig: Visualization.Config = {
      ...this.config,
      audioSource: this.currentBranchedAudioNode
    };

    const vis = new visClass(newConfig);
    this.currentVisualization = vis;
    this.millisUntilSwitch = this.autoAdvanceMillis;

    console.log("switched to", vis);
  }

  private goToNextVisualization() {
    this.switchToVisualization((this.currentVisualizationIndex + 1) % this.visualizations.length);
  }

  public render(context: Visualization.FrameContext) {
    this.millisUntilSwitch -= context.elapsedMillis;
    const shouldSwitch = (this.millisUntilSwitch < 0 || this.button.pressedSinceLastFrame);
    if (shouldSwitch) {
      const leftoverMillis = Math.max(0, Math.min(this.autoAdvanceMillis, -1 * this.millisUntilSwitch));
      this.goToNextVisualization();
      this.millisUntilSwitch -= leftoverMillis;
    }

    const vis = this.currentVisualization;
    vis.render(context);
    vis.ledRows.copy(this.ledRows);
  }
}