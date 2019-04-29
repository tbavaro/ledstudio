import * as React from "react";
import * as Three from "three";

import "./SimulationViewport.css";

const CAMERA_FOV_DEG = 75;
const CAMERA_NEAR_DISTANCE = 0.1;
const CAMERA_FAR_DISTANCE = 1000;

function initializeScene() {
  const scene = new Three.Scene();
  const geometry = new Three.BoxGeometry( 1, 1, 1 );
  const material = new Three.MeshBasicMaterial( { color: 0x00ff00 } );
  const cube = new Three.Mesh( geometry, material );
  scene.add( cube );
  return scene;
}

function initializeCamera() {
  const camera = new Three.PerspectiveCamera(
    CAMERA_FOV_DEG,
    /* aspect will get set in updateSizes */1,
    CAMERA_NEAR_DISTANCE,
    CAMERA_FAR_DISTANCE
  );
  camera.position.z = 5;
  return camera;
}

export default class SimulationViewport extends React.PureComponent<{}, {}> {
  private scene = initializeScene();
  private camera = initializeCamera();
  private renderer = new Three.WebGLRenderer();

  public componentDidMount() {
    if (super.componentDidMount) {
      super.componentDidMount();
    }
    this.ref.appendChild(this.renderer.domElement);
    this.updateSizes();

    window.addEventListener("resize", this.updateSizes);

    this.animate();
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
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
  }

  private animate = () => {
    requestAnimationFrame(this.animate);
    this.renderer.render(this.scene, this.camera);
  }
}
