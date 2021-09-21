import "./SimulationViewport.scss";

import * as React from "react";

import Scene from "../scenes/Scene";
import VisualizationRunner from "../VisualizationRunner";
import SimulationRenderer from "./SimulationRenderer";

interface Props {
  scene: Scene;
  visualizationRunner: VisualizationRunner;
  frameDidRender: (renderMillis: number) => void;
  enableBloom?: boolean;
}

export default class SimulationViewport extends React.Component<Props> {
  private readonly simulationRenderer = new SimulationRenderer();

  public componentDidMount() {
    super.componentDidMount?.();

    window.addEventListener("resize", this.updateSizes);
    window.addEventListener("blur", this.onWindowBlur);
    window.addEventListener("focus", this.onWindowFocus);
  }

  public componentWillUnmount() {
    this.simulationRenderer.destroy();

    window.removeEventListener("resize", this.updateSizes);
    window.removeEventListener("blur", this.onWindowBlur);
    window.removeEventListener("focus", this.onWindowFocus);

    super.componentWillUnmount?.();
  }

  public render() {
    const { props, simulationRenderer } = this;

    simulationRenderer.scene = props.scene;
    simulationRenderer.visualizationRunner = props.visualizationRunner;
    simulationRenderer.frameDidRender = props.frameDidRender;
    simulationRenderer.enableBloom = props.enableBloom ?? false;

    return <div className="SimulationViewport" ref={this.setContainer} />;
  }

  private readonly setContainer = (container: HTMLDivElement | null) => {
    this.simulationRenderer.container = container;
  };

  private updateSizes = () => this.simulationRenderer.updateSizes();
  private onWindowBlur = () => (this.simulationRenderer.active = false);
  private onWindowFocus = () => (this.simulationRenderer.active = true);
}
