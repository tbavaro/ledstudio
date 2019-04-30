import * as React from "react";
import * as Three from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

import { SceneDef, sceneDefs } from "./SceneDefs";

import "./SimulationViewport.css";

const CAMERA_FOV_DEG = 50;
const CAMERA_NEAR_DISTANCE = 0.1;
const CAMERA_FAR_DISTANCE = 1000;
const SCENE_DEF: SceneDef = sceneDefs[0];

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

  // const ledMaterial = new Three.MeshBasicMaterial({});
  private static readonly MATERIAL = new Three.MeshBasicMaterial({
    blending: Three.AdditiveBlending,
    transparent: true
  });

  private colors: Three.Color[] = [];

  constructor(scene: Three.Scene, position: Three.Vector3, color: Three.Color) {
    LedHelper.GEOMETRIES.forEach((geometry) => {
      geometry = geometry.clone();
      const material = LedHelper.MATERIAL.clone();
      this.colors.push(material.color);
      const mesh = new Three.Mesh(geometry, material);
      mesh.position.copy(position);
      scene.add(mesh);
    });
    this.setColor(color);
  }

  public setColor(color: Three.Color) {
    LedHelper.COLOR_MULTIPLIERS.forEach((m, i) => {
      this.colors[i].set(color);
      this.colors[i].multiplyScalar(m);
    });
  }
}

function addLeds(scene: Three.Scene) {
  const NUM_LEDS = 88;

  const start = new Three.Vector3(-6, 1.8, -1.38);
  const end = new Three.Vector3(6, 1.8, -1.38);
  const step = end.clone();
  step.sub(start);
  step.divideScalar(NUM_LEDS - 1);

  const result: LedHelper[] = [];
  for (let i = 0; i < NUM_LEDS; ++i) {
    const position = step.clone();
    position.multiplyScalar(i);
    position.add(start);
    const led = new LedHelper(
      scene,
      position,
      new Three.Color(0, 1, 0)
    );
      result.push(led);
  }

  return result;
}

export default class SimulationViewport extends React.PureComponent<{}, {}> {
  private scene = initializeScene();
  private camera = initializeCamera();
  private controls?: OrbitControls;
  private renderer = new Three.WebGLRenderer({ antialias: false });
  private fpsInterval?: NodeJS.Timeout;
  private fpsLastUpdateTime: number = 0;
  private fpsFramesSinceLastUpdate: number = 0;

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

    loadModel(SCENE_DEF, (model: Three.Scene) => {
      this.scene.add(model);
      addLeds(this.scene);
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
    this.renderer.setPixelRatio(window.devicePixelRatio);
    if (this.controls) {
      this.controls.update();
    }
  }

  private animate = () => {
    requestAnimationFrame(this.animate);
    this.renderer.render(this.scene, this.camera);
    // this.glowHelper.render();
    this.fpsFramesSinceLastUpdate++;
  }
}
