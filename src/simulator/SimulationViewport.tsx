import * as React from "react";
import * as Three from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import * as Colors from "../portable/base/Colors";
import { SendableLedStrip } from "../portable/SendableLedStrip";

import Scene from "../scenes/Scene";
import VisualizationRunner from "../VisualizationRunner";

import "./SimulationViewport.css";

const CAMERA_FOV_DEG = 50;
const CAMERA_NEAR_DISTANCE = 0.1;
const CAMERA_FAR_DISTANCE = 1000;

function initializeScene() {
  const renderScene = new Three.Scene();
  // renderScene.background = new Three.Color(.1, .1, .1);

  // renderScene.add(new Three.AmbientLight(0x333333));

  let light = new Three.DirectionalLight(0x111111);
  light.position.set(-100, 100, 100);
  light.castShadow = false;
  light.receiveShadow = false;
  renderScene.add(light);

  light = new Three.DirectionalLight(0x030303);
  light.position.set(100, 100, -100);
  light.castShadow = false;
  light.receiveShadow = false;
  renderScene.add(light);

  return renderScene;
}

interface LedHelper {
  setColor(color: Colors.Color): void;
  removeFromScene(): void;
}

class LedHelperFactory {
  private readonly renderScene: Three.Scene;
  private readonly ledGeometry: Three.PlaneBufferGeometry;

  constructor(renderScene: Three.Scene, ledRadius: number) {
    this.renderScene = renderScene;
    this.ledGeometry = new Three.PlaneBufferGeometry(ledRadius * 2, ledRadius * 2);
  }

  public createAt(position: Three.Vector3): LedHelper {
    return new LedHelperImpl(this.renderScene, this.ledGeometry, position);
  }
}

class LedHelperImpl implements LedHelper {
  private static readonly MATERIAL = new Three.MeshBasicMaterial({
    side: Three.DoubleSide
  });

  private color: Three.Color;

  constructor(renderScene: Three.Scene, geometry: Three.PlaneBufferGeometry, position: Three.Vector3) {
    const material = LedHelperImpl.MATERIAL.clone();
    this.color = material.color;
    const mesh = new Three.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    renderScene.add(mesh);
    this.removeFromScene = () => {
      renderScene.remove(mesh);
    };
  }

  public setColor(color: Colors.Color) {
    this.color.set(color);
  }

  public readonly removeFromScene: () => void;
}

class LedSceneStrip implements SendableLedStrip {
  public readonly size: number;
  private readonly ledHelpers: LedHelper[];
  private readonly onSend: () => void;

  constructor(ledHelpers: LedHelper[], onSend: () => void) {
    this.size = ledHelpers.length;
    this.ledHelpers = ledHelpers;
    this.onSend = onSend;
    this.reset();
  }

  public setColor(n: number, color: Colors.Color) {
    if (n >= 0 && n < this.ledHelpers.length) {
      this.ledHelpers[n].setColor(color);
    }
  }

  public setRange(startIndex: number, numLeds: number, color: Colors.Color) {
    if (startIndex < 0) {
      numLeds += startIndex;
      startIndex = 0;
    }

    numLeds = Math.min(numLeds, this.size - startIndex);

    if (numLeds > 0) {
      for (let i = startIndex; i < (startIndex + numLeds); ++i) {
        this.ledHelpers[i].setColor(color);
      }
    }
  }

  public reset(color?: Colors.Color): void {
    this.setRange(0, this.size, color || Colors.BLACK);
  }

  public send() {
    this.onSend();
  }

  public readonly averageSendTime = 0;
}

class LedScene {
  public readonly scene: Scene;
  public readonly ledStrip: SendableLedStrip;
  private ledHelpers: LedHelper[] = [];

  constructor(scene: Scene, renderScene: Three.Scene, doRender: () => void) {
    const ledHelperFactory = new LedHelperFactory(renderScene, scene.ledRadius);

    this.scene = scene;
    scene.leds.forEach(row => row.forEach(led => {
      this.ledHelpers.push(ledHelperFactory.createAt(led.position));
    }));

    this.ledStrip = new LedSceneStrip(this.ledHelpers, doRender);
  }

  public remove() {
    this.ledHelpers.forEach(helper => helper.removeFromScene());
  }
}

interface Props {
  scene: Scene;
  visualizationRunner: VisualizationRunner;
  frameDidRender: (renderMillis: number) => void;
}

type State = {
  renderScene: Three.Scene;
  readonly camera: Three.PerspectiveCamera;
  readonly controls: OrbitControls;
  registeredVisualizationRunner?: VisualizationRunner;
  currentScene?: Scene;
  currentLedScene?: LedScene;
  doRender: () => void;
};

export default class SimulationViewport extends React.Component<Props, State> {
  private renderer = new Three.WebGLRenderer({ antialias: true, preserveDrawingBuffer: false });

  public static getDerivedStateFromProps(nextProps: Readonly<Props>, prevState: State): Partial<State> | null {
    const result: Partial<State> = {
      currentScene: nextProps.scene,
      currentLedScene: prevState.currentLedScene,
      registeredVisualizationRunner: nextProps.visualizationRunner
    };

    if (nextProps.scene !== prevState.currentScene) {
      if (prevState.currentLedScene !== undefined) {
        prevState.currentLedScene.remove();
      }

      const renderScene = initializeScene();
      result.renderScene = renderScene;

      nextProps.scene.loadModel().then(model => renderScene.add(model));

      result.currentLedScene = new LedScene(nextProps.scene, renderScene, prevState.doRender);

      // point at target
      prevState.camera.position.copy(nextProps.scene.cameraStartPosition);
      prevState.controls.target = nextProps.scene.cameraTarget;
      prevState.controls.update();
    }

    if (prevState.registeredVisualizationRunner) {
      prevState.registeredVisualizationRunner.simulationLedStrip = undefined;
    }
    if (result.currentLedScene) {
      nextProps.visualizationRunner.simulationLedStrip = result.currentLedScene.ledStrip;
    }

    return result;
  }

  public componentDidMount() {
    if (super.componentDidMount) {
      super.componentDidMount();
    }

    this.renderer.gammaOutput = true;
    this.renderer.gammaFactor = 2.2;

    this.ref.appendChild(this.renderer.domElement);
    this.state.controls.domElement = this.ref;
    this.state.controls.update();

    this.updateSizes();

    window.addEventListener("resize", this.updateSizes);
    window.addEventListener("blur", this.onWindowBlur);
    window.addEventListener("focus", this.onWindowFocus);
  }

  public componentWillUnmount() {
    if (super.componentWillUnmount) {
      super.componentWillUnmount();
    }

    window.removeEventListener("resize", this.updateSizes);
    window.removeEventListener("blur", this.onWindowBlur);
    window.removeEventListener("focus", this.onWindowFocus);

    if (this.state.currentLedScene && this.props.visualizationRunner.simulationLedStrip === this.state.currentLedScene.ledStrip) {
      this.props.visualizationRunner.simulationLedStrip = undefined;
    }

    if (this.state.currentLedScene) {
      this.state.currentLedScene.remove();
    }
  }

  public shouldComponentUpdate() {
    return false;
  }

  public render() {
    console.log("rendering viewport");
    return (
      <div className="SimulationViewport" ref={this.setRef} />
    );
  }

  private unsafeRef: HTMLDivElement | null = null;
  private setRef = (newRef: HTMLDivElement) => this.unsafeRef = newRef;
  private get ref() {
    if (this.unsafeRef === null) {
      throw new Error("ref not set");
    }
    return this.unsafeRef;
  }

  private updateSizes = () => {
    const width = this.ref.clientWidth;
    const height = this.ref.clientHeight;
    this.state.camera.aspect = width / height;
    this.state.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    // this.renderer.setPixelRatio(window.devicePixelRatio);
    this.state.controls.update();
  }

  private isWindowFocused = true;
  private onWindowBlur = () => this.isWindowFocused = false;
  private onWindowFocus = () => this.isWindowFocused = true;

  private initialState(): State {
    const camera = new Three.PerspectiveCamera(
      CAMERA_FOV_DEG,
      /* aspect will get set in updateSizes */1,
      CAMERA_NEAR_DISTANCE,
      CAMERA_FAR_DISTANCE
    );

    return {
      renderScene: initializeScene(),
      camera: camera,
      controls: new OrbitControls(camera, this.renderer.domElement),
      doRender: () => {
        // render 3d scene
        const startTime = performance.now();
        if (this.isWindowFocused) {
          this.renderer.render(this.state.renderScene, this.state.camera);
        }
        const renderMillis = performance.now() - startTime;
        this.props.frameDidRender(renderMillis);
      }
    };
  }

  public state = this.initialState();
}
