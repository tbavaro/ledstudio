import * as Visualization from "../../base/Visualization";

const MILLIS_BETWEEN_AUTO_SWITCH = 5000;

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
  private millisUntilSwitch: number = MILLIS_BETWEEN_AUTO_SWITCH;

  constructor(config: Visualization.Config, visualizations: VisualizationClass[]) {
    super(config);
    this.visualizations = visualizations;

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
    const newConfig: Visualization.Config = {
      ...this.config,
      audioSource: this.currentBranchedAudioNode
    };

    const vis = new visClass(newConfig);
    this.currentVisualization = vis;
    this.millisUntilSwitch = MILLIS_BETWEEN_AUTO_SWITCH;

    console.log("switched to", vis);
  }

  private goToNextVisualization() {
    this.switchToVisualization((this.currentVisualizationIndex + 1) % this.visualizations.length);
  }

  public render(context: Visualization.FrameContext) {
    this.millisUntilSwitch -= context.elapsedMillis;
    if (this.millisUntilSwitch < 0) {
      const leftoverMillis = Math.min(MILLIS_BETWEEN_AUTO_SWITCH, -1 * this.millisUntilSwitch);
      this.goToNextVisualization();
      this.millisUntilSwitch -= leftoverMillis;
    }

    const vis = this.currentVisualization;
    vis.render(context);
    vis.ledRows.copy(this.ledRows);
  }
}