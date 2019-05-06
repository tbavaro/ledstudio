import * as React from "react";
import * as Three from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

import * as Colors from "./portable/base/Colors";
import LedStrip from "./portable/base/LedStrip";
import PianoEvent from "./portable/base/PianoEvent";
import PianoVisualization from "./portable/base/PianoVisualization";
import * as PianoVisualizations from "./portable/PianoVisualizations";

import * as PianoHelpers from "./portable/PianoHelpers";

import MidiEvent from "./MidiEvent";
import MidiEventListener, { MidiEventEmitter } from "./MidiEventListener";
import { SceneDef } from "./SceneDefs";

import "./SimulationViewport.css";

const CAMERA_FOV_DEG = 50;
const CAMERA_NEAR_DISTANCE = 0.1;
const CAMERA_FAR_DISTANCE = 1000;

const TARGET_FPS = 60;

class MovingAverageHelper {
  private readonly values: number[];
  private numValues: number = 0;
  private sum: number = 0;
  private nextIndex: number = 0;

  constructor(size: number) {
    this.values = new Array(size);
  }

  public get movingAverage() {
    return this.sum / this.numValues;
  }

  public addValue(value: number) {
    if (this.numValues === this.values.length) {
      this.sum -= this.values[this.nextIndex];
    } else {
      this.numValues ++;
    }
    this.values[this.nextIndex] = value;
    this.sum += value;
    this.nextIndex = (this.nextIndex + 1) % this.values.length;
  }
}

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

let cachedLedGlowSpriteMap: Three.Texture | undefined;
function ledGlowSpriteMap() {
  if (!cachedLedGlowSpriteMap) {
    cachedLedGlowSpriteMap = new Three.TextureLoader().load("led.png");
  }
  return cachedLedGlowSpriteMap;
}

class LedHelper {
  private static readonly LED_RADIUS = 0.03;

  private static readonly GEOMETRY = new Three.SphereGeometry(LedHelper.LED_RADIUS, 6, 6);

  private static readonly MATERIAL = new Three.MeshBasicMaterial({});

  private colors: Three.Color[] = [];

  private spriteMaterial: Three.SpriteMaterial;
  private glowSpriteMaterial: Three.SpriteMaterial;
  private sprites: Three.Sprite[] = [];

  constructor(scene: Three.Scene, position: Three.Vector3, color?: Three.Color) {
    this.spriteMaterial = new Three.SpriteMaterial({
      map: ledGlowSpriteMap(),
      color: color || 0x000000
    });
    this.glowSpriteMaterial = new Three.SpriteMaterial({
      map: ledGlowSpriteMap(),
      color: color || 0x000000,
      blending: Three.AdditiveBlending
    });
    const meshes: Three.Object3D[] = [];
    const geometry = LedHelper.GEOMETRY.clone();
    const material = LedHelper.MATERIAL.clone();
    this.colors.push(material.color);
    const mesh = new Three.Mesh(geometry, material);
    mesh.position.copy(position);
    // scene.add(mesh);
    meshes.push(mesh);

    const ledSprite = new Three.Sprite(this.spriteMaterial);
    ledSprite.position.copy(position);
    ledSprite.scale.setScalar(0.1);
    scene.add(ledSprite);
    this.sprites.push(ledSprite);
    this.colors.push(ledSprite.material.color);

    const glowSprite = new Three.Sprite(this.glowSpriteMaterial);
    glowSprite.position.copy(position);
    glowSprite.scale.setScalar(0.3);
    scene.add(glowSprite);
    this.sprites.push(glowSprite);

    if (color !== undefined) {
      this.setColor(color);
    }

    this.removeFromScene = () => {
      meshes.forEach(m => scene.remove(m));
      this.sprites.forEach(s => scene.remove(s));
    };
  }

  public setColor(color: Three.Color) {
    this.glowSpriteMaterial.setValues({ color: color.multiplyScalar(0.1) });
    this.colors.forEach(c => c.set(color.multiplyScalar(2)));
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

  private static convertColor(color: Colors.Color): Three.Color {
    return new Three.Color(color);
  }
}

class LedScene {
  public readonly sceneDef: SceneDef;
  public readonly ledStrip: LedStrip;
  private ledHelpers: LedHelper[] = [];

  constructor(ledSceneDef: SceneDef, scene: Three.Scene) {
    this.sceneDef = ledSceneDef;

    // place 3d Leds
    ledSceneDef.ledSegments.forEach(segment => {
      const numLeds = segment.numLeds;
      const step = segment.endPoint.clone();
      step.sub(segment.startPoint);
      step.divideScalar(segment.numLeds - 1);
      for (let i = 0; i < numLeds; ++i) {
        const position = step.clone();
        position.multiplyScalar(i);
        position.add(segment.startPoint);
        this.ledHelpers.push(new LedHelper(scene, position));
      }
    });

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
  private renderTimeMovingAverageHelper = new MovingAverageHelper(20);
  private visTimeMovingAverageHelper = new MovingAverageHelper(20);

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

      const averageRenderMillis = this.renderTimeMovingAverageHelper.movingAverage;
      const rLoad = averageRenderMillis / (1000 / TARGET_FPS);

      const averageVisMillis = this.visTimeMovingAverageHelper.movingAverage;
      const vLoad = averageVisMillis / (1000 / TARGET_FPS);

      this.fpsRef.innerText = [
        `${Math.round(fps)} fps`,
        `r=${Math.round(rLoad * 100)}%`,
        `v=${Math.round(vLoad * 100)}%`
      ].join(" / ");
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

    const startTime = performance.now();

    const vis = this.state.visualization;
    if (vis) {
      const visState = this.stateHelper.endFrame();
      const elapsedMillis = startTime - this.lastRenderTime;
      vis.render(elapsedMillis, visState);
      this.stateHelper.startFrame();
      this.lastRenderTime = startTime;

      const visTimeMillis = performance.now() - startTime;
      this.visTimeMovingAverageHelper.addValue(visTimeMillis);
    }

    this.renderer.render(this.state.scene, this.camera);
    // this.glowHelper.render();
    this.fpsFramesSinceLastUpdate++;

    const renderTimeMillis = performance.now() - startTime;
    this.renderTimeMovingAverageHelper.addValue(renderTimeMillis);
  }

  // TODO don't actually pass raw midi events in here, obv
  public onMidiEvent = (event: MidiEvent) => {
    if (event.pianoEvent !== null) {
      this.onPianoEvent(event.pianoEvent);
    }
  }

  public onPianoEvent = (event: PianoEvent) => this.stateHelper.applyEvent(event);
}
