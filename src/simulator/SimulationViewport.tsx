import "./SimulationViewport.css";

import * as React from "react";
import * as Three from "three";
import { sRGBEncoding } from "three";

import Scene from "../scenes/Scene";
import VisualizationRunner from "../VisualizationRunner";
import SimulationRenderer from "./SimulationRenderer";

interface Props {
  scene: Scene;
  visualizationRunner: VisualizationRunner;
  frameDidRender: (renderMillis: number) => void;
  enableBloom?: boolean;
}

type State = {
  simulationRenderer: SimulationRenderer;
  registeredVisualizationRunner: VisualizationRunner;
  containerElement: HTMLDivElement | null;
};

export default class SimulationViewport extends React.Component<Props, State> {
  private readonly renderer = new Three.WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: false
  });

  public state: State = SimulationViewport.getDerivedStateFromProps(this.props);

  public static getDerivedStateFromProps(
    nextProps: Readonly<Props>,
    prevState?: State
  ): State {
    let simulationRenderer = prevState?.simulationRenderer;
    let containerElement = prevState?.containerElement ?? null;

    if (
      simulationRenderer === undefined ||
      nextProps.visualizationRunner !== prevState?.registeredVisualizationRunner
    ) {
      console.log("making new sim renderer");
      simulationRenderer?.destroy?.();

      simulationRenderer = new SimulationRenderer({
        visualizationRunner: nextProps.visualizationRunner,
        frameDidRender: nextProps.frameDidRender
      });
    }

    simulationRenderer.setScene(nextProps.scene);
    simulationRenderer.enableBloom = nextProps.enableBloom ?? false;

    if (containerElement) {
      simulationRenderer.setContainer(containerElement);
    }

    return {
      simulationRenderer,
      registeredVisualizationRunner: nextProps.visualizationRunner,
      containerElement
    };
  }

  public componentDidMount() {
    super.componentDidMount?.();

    this.renderer.outputEncoding = sRGBEncoding;

    const containerElement = this.ref.current;
    if (containerElement === null) {
      throw new Error("ref not set");
    }
    this.setState({ containerElement });

    window.addEventListener("resize", this.updateSizes);
    window.addEventListener("blur", this.onWindowBlur);
    window.addEventListener("focus", this.onWindowFocus);
  }

  public componentWillUnmount() {
    window.removeEventListener("resize", this.updateSizes);
    window.removeEventListener("blur", this.onWindowBlur);
    window.removeEventListener("focus", this.onWindowFocus);
    this.state.simulationRenderer.destroy();
    super.componentWillUnmount?.();
  }

  public render() {
    return <div className="SimulationViewport" ref={this.ref} />;
  }

  private readonly ref = React.createRef<HTMLDivElement>();

  private updateSizes = () => this.state.simulationRenderer.updateSizes();

  private onWindowBlur = () => this.state.simulationRenderer.setActive(false);
  private onWindowFocus = () => this.state.simulationRenderer.setActive(true);
}
