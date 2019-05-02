import * as React from "react";
import * as Three from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

import Colors, { Color } from "./portable/base/Colors";
import LedStrip from "./portable/base/LedStrip";
import PianoEvent from "./portable/base/PianoEvent";
import PianoVisualization from "./portable/base/PianoVisualization";
import * as PianoVisualizations from "./portable/visualizations/PianoVisualizations";

import * as PianoHelpers from "./portable/PianoHelpers";

import MidiEvent from "./MidiEvent";
import MidiEventListener, { MidiEventEmitter } from "./MidiEventListener";
import { SceneDef } from "./SceneDefs";

import "./SimulationViewport.css";

const CAMERA_FOV_DEG = 50;
const CAMERA_NEAR_DISTANCE = 0.1;
const CAMERA_FAR_DISTANCE = 1000;

function initializeScene() {
  const scene = new Three.Scene();
  // scene.background = new Three.Color(.1, .1, .1);

  scene.add(new Three.AmbientLight(0x333333));

  let light = new Three.DirectionalLight(0xaaaaaa);
  light.position.set(-100, 100, 100);
  scene.add(light);

  light = new Three.DirectionalLight(0x444444);
  light.position.set(100, 100, -100);
  scene.add(light);

  return scene;
}

function initializeCamera() {
  const camera = new Three.PerspectiveCamera(
    CAMERA_FOV_DEG,
    /* aspect will get set in updateSizes */1,
    CAMERA_NEAR_DISTANCE,
    CAMERA_FAR_DISTANCE
  );
  camera.position.y = 7;
  camera.position.z = -14;
  return camera;
}

function loadModel(sceneDef: SceneDef, onLoad: (model: Three.Scene) => void) {
  const loader = new GLTFLoader();
  loader.load(
    sceneDef.modelUrl,
    /*onLoad=*/(gltf) => {
      const boundingBox = new Three.Box3().setFromObject(gltf.scene);
      const center = boundingBox.getCenter(new Three.Vector3());
      gltf.scene.translateX(-center.x);
      gltf.scene.translateY(-center.y);
      gltf.scene.translateZ(-center.z);
      const size = boundingBox.getSize(new Three.Vector3());
      gltf.scene.translateY(-size.y * (sceneDef.translateDownPercent || 0));
      onLoad(gltf.scene);
    },
    /*onProgress=*/undefined,
    /*onError*/(error) => {
      alert(`gltf error: ${error}`);
    }
  );
}

class LedHelper {
  private static readonly LED_RADIUS = 0.03;
  private static readonly RADIUS_MULTIPLIERS = [1, 1.3, 1.8];
  private static readonly COLOR_MULTIPLIERS = [1, 0.3, 0.2];

  private static readonly GEOMETRIES = LedHelper.RADIUS_MULTIPLIERS.map(m => (
    new Three.SphereGeometry(LedHelper.LED_RADIUS * m, 6, 6)
  ));

  private static readonly MATERIAL = new Three.MeshBasicMaterial({});
  private static readonly ADDITIVE_MATERIAL = new Three.MeshBasicMaterial({
    blending: Three.AdditiveBlending,
    transparent: true
  });

  private colors: Three.Color[] = [];

  constructor(scene: Three.Scene, position: Three.Vector3, color?: Three.Color) {
    const meshes: Three.Object3D[] = [];
    LedHelper.GEOMETRIES.forEach((geometry, i) => {
      geometry = geometry.clone();
      const material = (i === 0 ? LedHelper.MATERIAL : LedHelper.ADDITIVE_MATERIAL).clone();
      this.colors.push(material.color);
      const mesh = new Three.Mesh(geometry, material);
      mesh.position.copy(position);
      scene.add(mesh);
      meshes.push(mesh);
    });
    if (color !== undefined) {
      this.setColor(color);
    }
    this.removeFromScene = () => {
      meshes.forEach(mesh => scene.remove(mesh));
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

class LedSceneStrip implements LedStrip {
  public readonly size: number;
  private readonly ledHelpers: LedHelper[];

  constructor(ledHelpers: LedHelper[]) {
    this.size = ledHelpers.length;
    this.ledHelpers = ledHelpers;
    this.reset();
  }

  public setColor(n: number, color: Color) {
    if (n >= 0 && n < this.ledHelpers.length) {
      this.ledHelpers[n].setColor(LedSceneStrip.convertColor(color));
    }
  }

  public reset(color?: Color): void {
    for (let i = 0; i < this.size; ++i) {
      this.setColor(i, color || Colors.BLACK);
    }
  }

  private static convertColor(color: Color): Three.Color {
    return new Three.Color(color);
  }
}

class LedScene {
  public readonly sceneDef: SceneDef;
  public readonly ledStrip: LedStrip;
  private ledHelpers: LedHelper[] = [];

  constructor(ledSceneDef: SceneDef, scene: Three.Scene) {
    this.sceneDef = ledSceneDef;

    const numLeds = ledSceneDef.ledSegment.numLeds;

    // place 3d Leds
    const segment = ledSceneDef.ledSegment;
    const step = segment.endPoint.clone();
    step.sub(segment.startPoint);
    step.divideScalar(segment.numLeds - 1);
    for (let i = 0; i < numLeds; ++i) {
      const position = step.clone();
      position.multiplyScalar(i);
      position.add(segment.startPoint);
      this.ledHelpers.push(new LedHelper(scene, position));
    }
    this.ledStrip = new LedSceneStrip(this.ledHelpers);
  }

  public remove() {
    this.ledHelpers.forEach(helper => helper.removeFromScene());
  }
}

interface Props {
  midiEventEmitter: MidiEventEmitter;
  sceneDef: SceneDef;
  visualizationName: PianoVisualizations.Name;
}

type State = {
  readonly scene: Three.Scene;
  registeredMidiEventEmitter?: MidiEventEmitter;
  currentSceneDef?: SceneDef;
  currentVisualizationName?: PianoVisualizations.Name;
  currentLedScene?: LedScene;
  visualization?: PianoVisualization;
};

export default class SimulationViewport extends React.PureComponent<Props, State> implements MidiEventListener {
  public state: State = {
    scene: initializeScene()
  };

  private camera = initializeCamera();
  private controls?: OrbitControls;
  private renderer = new Three.WebGLRenderer({ antialias: false });
  private fpsInterval?: NodeJS.Timeout;
  private fpsLastUpdateTime: number = 0;
  private fpsFramesSinceLastUpdate: number = 0;
  private stateHelper: PianoHelpers.PianoVisualizationStateHelper;
  private lastRenderTime: number = 0;

  public static getDerivedStateFromProps(nextProps: Readonly<Props>, prevState: State): Partial<State> | null {
    const result: Partial<State> = {
      currentSceneDef: nextProps.sceneDef,
      currentVisualizationName: nextProps.visualizationName
    };

    if (
      prevState.registeredMidiEventEmitter !== undefined &&
      nextProps.midiEventEmitter !== prevState.registeredMidiEventEmitter
    ) {
      throw new Error("changing midiEventEmitter prop is unsupported");
    }

    const sceneDefChanged = (nextProps.sceneDef !== prevState.currentSceneDef);
    const visualizationNameChanged = (nextProps.visualizationName !== prevState.currentVisualizationName);
    if (sceneDefChanged || visualizationNameChanged) {
      if (prevState.currentLedScene !== undefined) {
        prevState.currentLedScene.remove();
      }
      const ledScene = new LedScene(nextProps.sceneDef, prevState.scene);
      result.visualization = PianoVisualizations.create(nextProps.visualizationName, ledScene.ledStrip);
      result.currentLedScene = ledScene;
    }

    return result;
  }

  public componentDidMount() {
    if (super.componentDidMount) {
      super.componentDidMount();
    }
    this.renderer.autoClear = true;

    this.ref.appendChild(this.renderer.domElement);
    this.controls = new OrbitControls(this.camera, this.ref);
    this.controls.update();

    this.updateSizes();

    window.addEventListener("resize", this.updateSizes);

    this.lastRenderTime = performance.now();

    this.stateHelper = new PianoHelpers.PianoVisualizationStateHelper();

    loadModel(this.props.sceneDef, (model: Three.Scene) => {
      this.state.scene.add(model);
      this.animate();
    });

    this.fpsLastUpdateTime = performance.now();
    this.fpsFramesSinceLastUpdate = 0;
    this.fpsInterval = setInterval(() => {
      const now = performance.now();
      const timeElapsed = now - this.fpsLastUpdateTime;
      const fps = this.fpsFramesSinceLastUpdate / timeElapsed * 1000;
      this.fpsLastUpdateTime = now;
      this.fpsFramesSinceLastUpdate = 0;
      this.fpsRef.innerText = `${Math.round(fps)}`;
    }, 1000);

    this.props.midiEventEmitter.addListener(this);
    this.setState({ registeredMidiEventEmitter: this.props.midiEventEmitter });
  }

  public componentWillUnmount() {
    if (super.componentWillUnmount) {
      super.componentWillUnmount();
    }
    window.removeEventListener("resize", this.updateSizes);
    if (this.fpsInterval) {
      clearInterval(this.fpsInterval);
      this.fpsInterval = undefined;
    }
  }

  public render() {
    console.log("rendering viewport");
    return (
      <div className="SimulationViewport" ref={this.setRef}>
        <div className="SimulationViewport-fpsDisplay" ref={this.setFpsRef}/>
      </div>
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

  private unsafeFpsRef: HTMLDivElement | null = null;
  private setFpsRef = (newRef: HTMLDivElement) => this.unsafeFpsRef = newRef;
  private get fpsRef() {
    if (this.unsafeFpsRef === null) {
      throw new Error("fps ref not set");
    }
    return this.unsafeFpsRef;
  }

  private updateSizes = () => {
    const width = this.ref.clientWidth;
    const height = this.ref.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    // this.renderer.setPixelRatio(window.devicePixelRatio);
    if (this.controls) {
      this.controls.update();
    }
  }

  private animate = () => {
    requestAnimationFrame(this.animate);

    const now = performance.now();

    const vis = this.state.visualization;
    if (vis) {
      const visState = this.stateHelper.endFrame();
      const elapsedMillis = now - this.lastRenderTime;
      vis.render(elapsedMillis, visState);
      this.stateHelper.startFrame();
      this.lastRenderTime = now;
    }

    this.renderer.render(this.state.scene, this.camera);
    // this.glowHelper.render();
    this.fpsFramesSinceLastUpdate++;
  }

  // TODO don't actually pass raw midi events in here, obv
  public onMidiEvent = (event: MidiEvent) => {
    if (event.pianoEvent !== null) {
      this.onPianoEvent(event.pianoEvent);
    }
  }

  public onPianoEvent = (event: PianoEvent) => this.stateHelper.applyEvent(event);
}
