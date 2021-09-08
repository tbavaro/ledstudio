import "./SimulationViewport.css";

import * as React from "react";
import * as Three from "three";
import { Vector2, sRGBEncoding } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";

import * as Colors from "../portable/base/Colors";
import { SendableLedStrip } from "../portable/SendableLedStrip";
import Scene from "../scenes/Scene";
import VisualizationRunner from "../VisualizationRunner";

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
    this.ledGeometry = new Three.PlaneBufferGeometry(
      ledRadius * 2,
      ledRadius * 2
    );
  }

  public createAt(position: Three.Vector3): LedHelper {
    return new LedHelperImpl(this.renderScene, this.ledGeometry, position);
  }
}

class LedHelperImpl implements LedHelper {
  private static readonly MATERIAL = new Three.MeshBasicMaterial({
    side: Three.DoubleSide
  });

  private readonly material: typeof LedHelperImpl.MATERIAL;

  constructor(
    renderScene: Three.Scene,
    geometry: Three.PlaneBufferGeometry,
    position: Three.Vector3
  ) {
    this.material = LedHelperImpl.MATERIAL.clone();
    const mesh = new Three.Mesh(geometry, this.material);
    mesh.position.copy(position);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    renderScene.add(mesh);
    this.removeFromScene = () => {
      renderScene.remove(mesh);
    };
  }

  public setColor(color: Colors.Color) {
    this.material.color.set(color);
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
      for (let i = startIndex; i < startIndex + numLeds; ++i) {
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
    scene.ledMetadatas.forEach(led => {
      this.ledHelpers.push(ledHelperFactory.createAt(led.position));
    });

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
  enableBloom?: boolean;
}

type State = {
  renderScene: Three.Scene;
  readonly composer: EffectComposer;
  readonly bloomPass: UnrealBloomPass;
  readonly camera: Three.PerspectiveCamera;
  readonly renderPass: RenderPass;
  readonly controls: OrbitControls;
  registeredVisualizationRunner?: VisualizationRunner;
  currentScene?: Scene;
  currentLedScene?: LedScene;
  doRender: () => void;
};

export default class SimulationRenderer {
  private readonly renderer: Three.WebGLRenderer;
  private readonly camera: Three.PerspectiveCamera;
  private readonly controls: OrbitControls;
  private readonly bloomPass: UnrealBloomPass;
  private readonly composer: EffectComposer;
  private readonly renderScene: Three.Scene;

  private readonly frameDidRender?: (renderMillis: number) => void;

  private container: HTMLDivElement | null = null;

  public active = true;
  public enableBloom = true;

  public constructor(attrs?: {
    frameDidRender?: (renderMillis: number) => void;
  }) {
    this.renderer = new Three.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: false
    });
    this.renderer.outputEncoding = sRGBEncoding;

    this.camera = new Three.PerspectiveCamera(
      CAMERA_FOV_DEG,
      /* aspect will get set in updateSizes */ 1,
      CAMERA_NEAR_DISTANCE,
      CAMERA_FAR_DISTANCE
    );

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.renderScene = initializeScene();

    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.renderScene, this.camera);
    this.bloomPass = new UnrealBloomPass(new Vector2(10, 10), 2, 0.4, 0.7);
    this.composer.addPass(renderPass);
    this.composer.addPass(this.bloomPass);

    this.frameDidRender = attrs?.frameDidRender;
  }

  public setContainer(container: HTMLDivElement | null) {
    const oldContainer = this.container;

    if (container === oldContainer) {
      // no change
      return;
    }

    if (oldContainer !== null) {
      oldContainer.removeChild(this.renderer.domElement);
    }

    if (container !== null) {
      container.appendChild(this.renderer.domElement);
      this.controls.domElement = container;
    } else {
      this.controls.domElement = this.renderer.domElement;
    }
    this.controls.update();

    this.container = container;

    if (container !== null) {
      this.updateSizes();
    }
  }

  public doRender() {
    // render 3d scene
    const startTime = performance.now();
    if (this.active) {
      // this.renderer.render(this.state.renderScene, this.state.camera);
      if (this.enableBloom) {
        this.composer.render();
      } else {
        this.renderer.render(this.renderScene, this.camera);
      }
    }
    const renderMillis = performance.now() - startTime;

    this.frameDidRender?.(renderMillis);
  }

  public static getDerivedStateFromProps(
    nextProps: Readonly<Props>,
    prevState: State
  ): Partial<State> | null {
    const result: Partial<State> = {
      currentScene: nextProps.scene,
      currentLedScene: prevState.currentLedScene,
      registeredVisualizationRunner: nextProps.visualizationRunner
    };

    let renderPass = prevState.renderPass;
    let renderScene = prevState.renderScene;

    if (nextProps.scene !== prevState.currentScene) {
      if (prevState.currentLedScene !== undefined) {
        prevState.currentLedScene.remove();
      }

      renderScene = initializeScene();
      result.renderScene = renderScene;

      // this forces it to get reset later
      if (renderPass !== undefined) {
        renderPass.scene = renderScene;
      }

      nextProps.scene.loadModel().then(model => renderScene.add(model));

      result.currentLedScene = new LedScene(
        nextProps.scene,
        renderScene,
        prevState.doRender
      );

      // point at target
      prevState.camera.position.copy(nextProps.scene.cameraStartPosition);
      prevState.controls.target = nextProps.scene.cameraTarget;
      prevState.controls.update();
    }

    if (prevState.registeredVisualizationRunner) {
      prevState.registeredVisualizationRunner.simulationLedStrip = undefined;
    }
    if (result.currentLedScene) {
      nextProps.visualizationRunner.simulationLedStrip =
        result.currentLedScene.ledStrip;
    }

    return { ...result };
  }

  public componentWillUnmount() {
    window.removeEventListener("resize", this.updateSizes);
    window.removeEventListener("blur", this.onWindowBlur);
    window.removeEventListener("focus", this.onWindowFocus);

    if (
      this.state.currentLedScene &&
      this.props.visualizationRunner.simulationLedStrip ===
        this.state.currentLedScene.ledStrip
    ) {
      this.props.visualizationRunner.simulationLedStrip = undefined;
    }

    if (this.state.currentLedScene) {
      this.state.currentLedScene.remove();
    }
  }

  private readonly updateSizes = () => {
    const container = this.container;
    if (container === null) {
      return;
    }

    const width = container.clientWidth;
    const height = container.clientHeight;
    const pixelRatio = window.devicePixelRatio || 1;

    const speedupFactor = 0;
    const effectivePixelRatio = pixelRatio / (1 + speedupFactor);

    const { camera, bloomPass, /* renderPass, */ composer } = this;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);

    // renderPass?.setSize(width * 3, height * 3);

    // composer.reset();
    composer.setSize(width, height);
    composer.setPixelRatio(effectivePixelRatio);
    bloomPass.setSize(
      width * effectivePixelRatio,
      height * effectivePixelRatio
    );
    // composer.addPass(renderPass!);
    // composer.addPass(bloomPass);

    // this.renderer.setPixelRatio(window.devicePixelRatio);
    this.controls.update();
  };
}
