import * as React from "react";
import * as Three from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

import { SceneDef, sceneDefs } from "./SceneDefs";
import GlowHelper from "./webgl/GlowHelper";

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

  // const geometry = new Three.BoxGeometry( 1, 1, 1 );
  // const material = new Three.MeshBasicMaterial( { color: 0x00ff00 } );
  // const cube = new Three.Mesh( geometry, material );
  // scene.add( cube );
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

function addLeds(scene: Three.Scene, glowScene: Three.Scene) {
  const NUM_LEDS = 20;
  const LED_SPACING = 1;

  const ledGeometry = new Three.SphereGeometry(0.075, 4, 4);
  const glowLedGeometry = new Three.SphereGeometry(0.2, 6, 6);

  const ledMaterial = new Three.MeshBasicMaterial({});
  const glowLedMaterial = new Three.MeshBasicMaterial({
    blending: Three.AdditiveBlending,
    transparent: true
  });

  for (let i = 0; i < NUM_LEDS; ++i) {
    const material = ledMaterial.clone();
    const glowMaterial = glowLedMaterial.clone();
    glowMaterial.color = material.color;
    material.color.set(new Three.Color(1, 0, 0));

    const led = new Three.Mesh(ledGeometry, material);
    led.position.set(i * LED_SPACING, 0, 0);
    scene.add(led);

    const glowLed = new Three.Mesh(glowLedGeometry, glowMaterial);
    glowLed.position.copy(led.position);
    glowScene.add(glowLed);
  }
}

export default class SimulationViewport extends React.PureComponent<{}, {}> {
  private scene = initializeScene();
  private glowScene = new Three.Scene();
  private camera = initializeCamera();
  private controls?: OrbitControls;
  private renderer = new Three.WebGLRenderer({ antialias: false });
  private glowHelper: GlowHelper;

  public componentDidMount() {
    if (super.componentDidMount) {
      super.componentDidMount();
    }
    this.renderer.autoClear = true;

    this.ref.appendChild(this.renderer.domElement);
    this.controls = new OrbitControls(this.camera, this.ref);
    this.controls.update();

    this.glowHelper = new GlowHelper({
      renderer: this.renderer,
      camera: this.camera,
      scene: this.scene,
      glowScene: this.glowScene
    });

    this.updateSizes();

    window.addEventListener("resize", this.updateSizes);

    loadModel(SCENE_DEF, (model: Three.Scene) => {
      this.scene.add(model);
      this.glowScene.add(model.clone());
      addLeds(this.scene, this.glowScene);
      this.animate();
    });
  }

  public componentWillUnmount() {
    if (super.componentWillUnmount) {
      super.componentWillUnmount();
    }
    window.removeEventListener("resize", this.updateSizes);
  }

  public render() {
    return (
      <div className="SimulationViewport" ref={this.setRef}/>
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
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.glowHelper.setSize(width, height);
    // this.renderer.setPixelRatio(window.devicePixelRatio);
    if (this.controls) {
      this.controls.update();
    }
  }

  private animate = () => {
    requestAnimationFrame(this.animate);
    // this.renderer.render(this.scene, this.camera);
    this.glowHelper.render();
  }
}
