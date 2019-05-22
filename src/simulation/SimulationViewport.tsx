import * as React from "react";
import * as Three from "three";
import { Vector3 } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import * as Colors from "../portable/base/Colors";
import { SendableLedStrip } from "../portable/SendableLedStrip";

import PianoVisualizationRunner from "../PianoVisualizationRunner";
import * as Scenes from "../Scenes";

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

class LedHelper {
  private static readonly LED_RADIUS = 0.008;
  private static readonly RADIUS_MULTIPLIERS = [1];
  private static readonly COLOR_MULTIPLIERS = [1];
  private static readonly GLOW_POSITION_OFFSET = new Vector3(0, 0, -0.0001);

  private static readonly GEOMETRIES = LedHelper.RADIUS_MULTIPLIERS.map(m => (
    new Three.PlaneBufferGeometry(LedHelper.LED_RADIUS * m, LedHelper.LED_RADIUS * m)
  ));

  private static readonly MATERIAL = new Three.MeshBasicMaterial({
    side: Three.DoubleSide
  });
  private static readonly ADDITIVE_MATERIAL = new Three.MeshBasicMaterial({
    blending: Three.AdditiveBlending,
    transparent: true,
    side: Three.DoubleSide,
    depthWrite: false
  });

  private colors: Three.Color[] = [];

  constructor(renderScene: Three.Scene, position: Three.Vector3, color?: Three.Color) {
    const meshes: Three.Object3D[] = [];
    LedHelper.GEOMETRIES.forEach((geometry, i) => {
      // geometry = geometry.clone();
      const isGlowMesh = (i > 0);
      const material = (isGlowMesh ? LedHelper.ADDITIVE_MATERIAL : LedHelper.MATERIAL).clone();
      this.colors.push(material.color);
      const mesh = new Three.Mesh(geometry, material);
      // if (isGlowMesh) {
      //   mesh.rotateZ(Math.PI / 4);
      // }
      mesh.position.copy(position);
      if (isGlowMesh) {
        mesh.position.add(LedHelper.GLOW_POSITION_OFFSET);
      }
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      renderScene.add(mesh);
      meshes.push(mesh);
    });
    if (color !== undefined) {
      this.setColor(color);
    }
    this.removeFromScene = () => {
      meshes.forEach(mesh => renderScene.remove(mesh));
    };
  }

  public setColor(color: Three.Color) {
    LedHelper.COLOR_MULTIPLIERS.forEach((m, i) => {
      this.colors[i].set(color);
      this.colors[i].multiplyScalar(m);
    });
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
      this.ledHelpers[n].setColor(LedSceneStrip.convertColor(color));
    }
  }

  public setRange(startIndex: number, numLeds: number, color: Colors.Color) {
    const convertedColor = LedSceneStrip.convertColor(color);

    if (startIndex < 0) {
      numLeds += startIndex;
      startIndex = 0;
    }

    numLeds = Math.min(numLeds, this.size - startIndex);

    if (numLeds > 0) {
      for (let i = startIndex; i < (startIndex + numLeds); ++i) {
        this.ledHelpers[i].setColor(convertedColor);
      }
    }
  }

  public reset(color?: Colors.Color): void {
    this.setRange(0, this.size, color || Colors.BLACK);
  }

  public send() {
    this.onSend();
  }

  private static convertColor(color: Colors.Color): Three.Color {
    return new Three.Color(color);
  }
}

class LedScene {
  public readonly scene: Scenes.Scene;
  public readonly ledStrip: SendableLedStrip;
  private ledHelpers: LedHelper[] = [];

  constructor(scene: Scenes.Scene, renderScene: Three.Scene, doRender: () => void) {
    this.scene = scene;
    scene.ledPositions.forEach(row => row.forEach(point => {
      this.ledHelpers.push(new LedHelper(renderScene, point));
    }));

    this.ledStrip = new LedSceneStrip(this.ledHelpers, doRender);
  }

  public remove() {
    this.ledHelpers.forEach(helper => helper.removeFromScene());
  }
}

interface Props {
  scene: Scenes.Scene;
  visualizationRunner: PianoVisualizationRunner;
  frameDidRender: (renderMillis: number) => void;
}

type State = {
  readonly renderScene: Three.Scene;
  readonly camera: Three.PerspectiveCamera;
  readonly controls: OrbitControls;
  registeredVisualizationRunner?: PianoVisualizationRunner;
  currentScene?: Scenes.Scene;
  currentLedScene?: LedScene;
  doRender: () => void;
};

export default class SimulationViewport extends React.Component<Props, State> {
  private renderer = new Three.WebGLRenderer({ antialias: false, preserveDrawingBuffer: false });

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

      result.currentLedScene = new LedScene(nextProps.scene, prevState.renderScene, prevState.doRender);

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

    this.props.scene.loadModel().then(model => this.state.renderScene.add(model));
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
