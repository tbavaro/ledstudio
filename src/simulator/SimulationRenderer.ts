import "./SimulationViewport.scss";

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

const BLOOM_STRENGTH = 1;
const BLOOM_RADIUS = 0.1;
const BLOOM_THRESHOLD = 0.1;

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

class LedMesh {
  private static readonly MATERIAL = new Three.MeshBasicMaterial({
    side: Three.DoubleSide
  });

  private readonly material: typeof LedMesh.MATERIAL;

  constructor(
    renderScene: Three.Scene,
    geometry: Three.PlaneBufferGeometry,
    position: Three.Vector3
  ) {
    this.material = LedMesh.MATERIAL.clone();
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

class LedMeshFactory {
  private readonly renderScene: Three.Scene;
  private readonly ledGeometry: Three.PlaneBufferGeometry;

  constructor(renderScene: Three.Scene, ledRadius: number) {
    this.renderScene = renderScene;
    this.ledGeometry = new Three.PlaneBufferGeometry(
      ledRadius * 2,
      ledRadius * 2
    );
  }

  public createAt(position: Three.Vector3): LedMesh {
    return new LedMesh(this.renderScene, this.ledGeometry, position);
  }
}

class LedSceneStrip implements SendableLedStrip {
  public readonly size: number;
  private readonly ledMeshes: LedMesh[];
  private readonly onSend: () => void;

  constructor(ledMeshes: LedMesh[], onSend: () => void) {
    this.size = ledMeshes.length;
    this.ledMeshes = ledMeshes;
    this.onSend = onSend;
    this.reset();
  }

  public setColor(n: number, color: Colors.Color) {
    if (n >= 0 && n < this.ledMeshes.length) {
      this.ledMeshes[n].setColor(color);
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
        this.ledMeshes[i].setColor(color);
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
  private ledMeshes: LedMesh[] = [];

  constructor(scene: Scene, renderScene: Three.Scene, doRender: () => void) {
    const factory = new LedMeshFactory(renderScene, scene.ledRadius);

    this.scene = scene;

    for (const led of scene.ledMetadatas) {
      this.ledMeshes.push(factory.createAt(led.position));
    }

    this.ledStrip = new LedSceneStrip(this.ledMeshes, doRender);
  }

  public remove() {
    this.ledMeshes.forEach(m => m.removeFromScene());
  }
}

export default class SimulationRenderer {
  private readonly renderer: Three.WebGLRenderer;
  private readonly composer: EffectComposer;
  private readonly renderPass: RenderPass;
  private readonly bloomPass: UnrealBloomPass;
  private readonly camera: Three.PerspectiveCamera;
  private readonly controls: OrbitControls;

  #scene?: Scene;
  #visualizationRunner?: VisualizationRunner;
  #container: HTMLDivElement | null = null;
  #active = true;

  private renderScene: Three.Scene;
  private ledScene?: LedScene;

  public frameDidRender?: (renderMillis: number) => void;

  public enableBloom = true;

  public constructor() {
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
    this.renderPass = new RenderPass(this.renderScene, this.camera);
    this.bloomPass = new UnrealBloomPass(
      new Vector2(),
      BLOOM_STRENGTH,
      BLOOM_RADIUS,
      BLOOM_THRESHOLD
    );
    this.composer.addPass(this.renderPass);
    this.composer.addPass(this.bloomPass);
  }

  public set container(container: HTMLDivElement | null) {
    const oldContainer = this.#container;

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

    this.#container = container;

    if (container !== null) {
      this.updateSizes();
    }
  }

  public readonly doRender = () => {
    // render 3d scene
    const startTime = performance.now();
    if (this.#active) {
      // this.renderer.render(this.state.renderScene, this.state.camera);
      if (this.enableBloom) {
        this.composer.render();
      } else {
        this.renderer.render(this.renderScene, this.camera);
      }
    }
    const renderMillis = performance.now() - startTime;

    this.frameDidRender?.(renderMillis);
  };

  public set scene(newScene: Scene) {
    if (newScene === this.#scene) {
      return;
    }

    this.#scene = newScene;

    if (this.ledScene !== undefined) {
      this.ledScene.remove();
      this.ledScene = undefined;
    }

    const newRenderScene = initializeScene();
    this.renderScene = newRenderScene;

    if (this.renderPass !== undefined) {
      this.renderPass.scene = this.renderScene;
    }

    newScene.loadModel().then(model => {
      if (this.renderScene === newRenderScene) {
        this.renderScene.add(model);
      }
    });

    this.ledScene = new LedScene(newScene, this.renderScene, this.doRender);

    // point at target
    this.camera.position.copy(newScene.cameraStartPosition);
    this.controls.target = newScene.cameraTarget;
    this.controls.update();

    if (this.#visualizationRunner) {
      this.#visualizationRunner.simulationLedStrip = this.ledScene.ledStrip;
    }
  }

  public set visualizationRunner(newVisualizationRunner: VisualizationRunner) {
    if (newVisualizationRunner === this.#visualizationRunner) {
      return;
    }

    if (this.#visualizationRunner) {
      this.#visualizationRunner.simulationLedStrip = undefined;
      this.#visualizationRunner = undefined;
    }

    this.#visualizationRunner = newVisualizationRunner;

    if (this.ledScene) {
      this.#visualizationRunner.simulationLedStrip = this.ledScene.ledStrip;
    }
  }

  public destroy() {
    if (
      this.ledScene &&
      this.#visualizationRunner &&
      this.#visualizationRunner.simulationLedStrip === this.ledScene.ledStrip
    ) {
      this.#visualizationRunner.simulationLedStrip = undefined;
    }

    if (this.ledScene) {
      this.ledScene.remove();
      this.ledScene = undefined;
    }

    this.container = null;
  }

  public set active(value: boolean) {
    this.#active = value;
  }

  public readonly updateSizes = () => {
    const container = this.#container;
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
    this.renderer.setPixelRatio(effectivePixelRatio);

    // composer.reset();
    composer.setSize(width, height);
    composer.setPixelRatio(effectivePixelRatio);
    bloomPass.setSize(
      width * effectivePixelRatio,
      height * effectivePixelRatio
    );

    this.controls.update();
  };
}
