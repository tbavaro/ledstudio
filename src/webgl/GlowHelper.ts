import * as Three from "three";
import * as ThreeEx from "./TranslatedThreeExamples";

function createGlowComposer(
  renderer: Three.WebGLRenderer,
  camera: Three.Camera,
  glowScene: Three.Scene,
  width: number,
  height: number,
  renderTargetOptions?: Three.WebGLRenderTargetOptions
) {
  const glowRenderTarget = new Three.WebGLRenderTarget(
    width,
    height,
    renderTargetOptions
  );

  const hBlur = new ThreeEx.ShaderPass(ThreeEx.HorizontalBlurShader);
  const vBlur = new ThreeEx.ShaderPass(ThreeEx.VerticalBlurShader);

  const blurriness = 2.0;
  hBlur.uniforms.h.value = blurriness / width;
  vBlur.uniforms.v.value = blurriness / height;

  const renderModelGlow = new ThreeEx.RenderPass(glowScene, camera);

  const glowComposer = new ThreeEx.EffectComposer(renderer, glowRenderTarget);
  glowComposer.addPass(renderModelGlow);
  glowComposer.addPass(hBlur);
  glowComposer.addPass(vBlur);

  return glowComposer;
}

function createFinalShader(glowComposer: ThreeEx.EffectComposer): ThreeEx.Shader {
  return {
    uniforms: {
      // the base scene buffer
      tDiffuse: {
        type: "t",
        texture: null
      },

      // the glow scene buffer
      tGlow: {
        type: "t",
        value: glowComposer.renderTarget1
      }
    },

    vertexShader: [
      "varying vec2 vUv;",
      "void main() {",
        "vUv = vec2( uv.x, uv.y );",
        "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
      "}",
    ].join("\n"),

    fragmentShader: [
      "uniform sampler2D tDiffuse;",
      "uniform sampler2D tGlow;",
      "varying vec2 vUv;",
      "void main() {",
        "vec4 texel = texture2D( tDiffuse, vUv );",
        "vec4 glow = texture2D( tGlow, vUv );",
        "gl_FragColor = texel + (glow * glow) * 0.5;",
      "}"
    ].join("\n")
  };
}

export default class GlowHelper {
  private readonly renderer: Three.WebGLRenderer;
  private readonly camera: Three.Camera;
  private readonly scene: Three.Scene;
  private readonly glowScene: Three.Scene;

  private glowComposer?: ThreeEx.EffectComposer;
  private finalComposer?: ThreeEx.EffectComposer;

  constructor(attrs: {
    renderer: Three.WebGLRenderer,
    camera: Three.Camera,
    scene: Three.Scene,
    glowScene: Three.Scene
  }) {
    this.renderer = attrs.renderer;
    this.camera = attrs.camera;
    this.scene = attrs.scene;
    this.glowScene = attrs.glowScene;
  }

  public setSize(width: number, height: number) {
    const renderTargetParameters = {
      minFilter: Three.LinearFilter,
      magFilter: Three.LinearFilter,
      format: Three.RGBFormat,
      stencilBuffer: false
    };

    this.glowComposer = createGlowComposer(
      this.renderer,
      this.camera,
      this.glowScene,
      width,
      height,
      renderTargetParameters
    );

    const finalShader = createFinalShader(this.glowComposer);

    // prepare the base scene render pass
    const renderModel = new ThreeEx.RenderPass(this.scene, this.camera);

    // prepare the additive blending pass
    const finalPass = new ThreeEx.ShaderPass(finalShader);
    finalPass.needsSwap = true;

    // make sure the additive blending is rendered to the screen (since it's the last pass)
    finalPass.renderToScreen = true;

    // prepare the composer's render target
    const renderTarget = new Three.WebGLRenderTarget(width, height, renderTargetParameters);

    // create the composer
    this.finalComposer = new ThreeEx.EffectComposer(this.renderer, renderTarget);

    // add all passes
    this.finalComposer.addPass(renderModel);
    this.finalComposer.addPass(finalPass);
  }

  public render() {
    if (!this.glowComposer || !this.finalComposer) {
      throw new Error("composesrs not initialized");
    }

    this.glowComposer.render();
    this.finalComposer.render();
  }
}
