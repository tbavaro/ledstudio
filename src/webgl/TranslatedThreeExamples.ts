/* tslint:disable */

// translated from three.js examples since they're not jsm or ts :(

import * as Three from "three";

export type Shader = Three.ShaderMaterialParameters;
type XCXCBuffer = any;

export class EffectComposer {
  private renderer: Three.WebGLRenderer;
  private renderTarget1: Three.WebGLRenderTarget;
  public renderTarget2: Three.WebGLRenderTarget;
  private writeBuffer: any;
  private readBuffer: any;
  private renderToScreen: boolean;
  private passes: Pass[];
  private copyPass: any;
  private _previousFrameTime: number;

  constructor(renderer: Three.WebGLRenderer, renderTarget?: Three.WebGLRenderTarget) {
    this.renderer = renderer;

    if ( renderTarget === undefined ) {
      var parameters = {
        minFilter: Three.LinearFilter,
        magFilter: Three.LinearFilter,
        format: Three.RGBAFormat,
        stencilBuffer: false
      };

      var size = renderer.getDrawingBufferSize( new Three.Vector2());
      renderTarget = new Three.WebGLRenderTarget(size.width, size.height, parameters);
      renderTarget.texture.name = 'EffectComposer.rt1';
    }

    this.renderTarget1 = renderTarget;
    this.renderTarget2 = renderTarget.clone();
    this.renderTarget2.texture.name = 'EffectComposer.rt2';
    this.writeBuffer = this.renderTarget1;
    this.readBuffer = this.renderTarget2;
    this.renderToScreen = true;
    this.passes = [];
    this.copyPass = new ShaderPass(CopyShader);
    this._previousFrameTime = Date.now();
  }

	public swapBuffers() {
		var tmp = this.readBuffer;
		this.readBuffer = this.writeBuffer;
		this.writeBuffer = tmp;
	}

	public addPass(pass: Pass) {
		this.passes.push( pass );
		var size = this.renderer.getDrawingBufferSize( new Three.Vector2() );
		pass.setSize( size.width, size.height );
	}

	public insertPass( pass: Pass, index: number) {
		this.passes.splice( index, 0, pass );
	}

	public isLastEnabledPass( passIndex: number ) {
		for ( var i = passIndex + 1; i < this.passes.length; i ++ ) {
			if ( this.passes[ i ].enabled ) {
				return false;
			}
		}
		return true;
	}

	public render(deltaTime?: number) {
		// deltaTime value is in seconds
		if ( deltaTime === undefined ) {
			deltaTime = ( Date.now() - this._previousFrameTime ) * 0.001;
		}
		this._previousFrameTime = Date.now();
		var currentRenderTarget = this.renderer.getRenderTarget();
		var maskActive = false;
		var pass, i, il = this.passes.length;
		for ( i = 0; i < il; i ++ ) {
			pass = this.passes[ i ];
			if ( pass.enabled === false ) continue;
			pass.renderToScreen = ( this.renderToScreen && this.isLastEnabledPass( i ) );
			pass.render( this.renderer, this.writeBuffer, this.readBuffer, deltaTime, maskActive );
			if ( pass.needsSwap ) {
				if ( maskActive ) {
					var context = this.renderer.context;
					context.stencilFunc( context.NOTEQUAL, 1, 0xffffffff );
					this.copyPass.render( this.renderer, this.writeBuffer, this.readBuffer, deltaTime );
					context.stencilFunc( context.EQUAL, 1, 0xffffffff );
				}
				this.swapBuffers();
			}

			// if ( THREE.MaskPass !== undefined ) {

			// 	if ( pass instanceof THREE.MaskPass ) {

			// 		maskActive = true;

			// 	} else if ( pass instanceof THREE.ClearMaskPass ) {

			// 		maskActive = false;

			// 	}

			// }
		}

		this.renderer.setRenderTarget( currentRenderTarget );
	}

	public reset( renderTarget: Three.WebGLRenderTarget) {
		if ( renderTarget === undefined ) {
			var size = this.renderer.getDrawingBufferSize( new Three.Vector2() );
			renderTarget = this.renderTarget1.clone();
			renderTarget.setSize( size.width, size.height );
		}

		this.renderTarget1.dispose();
		this.renderTarget2.dispose();
		this.renderTarget1 = renderTarget;
		this.renderTarget2 = renderTarget.clone();

		this.writeBuffer = this.renderTarget1;
		this.readBuffer = this.renderTarget2;
	}

	public setSize( width: number, height: number) {
		this.renderTarget1.setSize( width, height );
		this.renderTarget2.setSize( width, height );
		for ( var i = 0; i < this.passes.length; i ++ ) {
			this.passes[ i ].setSize( width, height );
		}
	}
}

export abstract class Pass {
  // if set to true, the pass is processed by the composer
  public enabled = true;

  // if set to true, the pass indicates to swap read and write buffer after rendering
  public needsSwap = true;

  // if set to true, the pass clears its buffer before rendering
  public clear = false;

  // if set to true, the result of the pass is rendered to screen. This is set automatically by EffectComposer.
  public renderToScreen = false;

	public setSize(width: number, height: number): void {}
  public abstract render(renderer: Three.WebGLRenderer, writeBuffer: XCXCBuffer, readBuffer: XCXCBuffer, deltaTime: number, maskActive: boolean): void;
}

// Helper for passes that need to fill the viewport with a single quad.
class FullScreenQuad {
	private static camera = new Three.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
	private static geometry = new Three.PlaneBufferGeometry( 2, 2 );

  private mesh: Three.Mesh;

  constructor(material: Three.Material) {
    this.mesh = new Three.Mesh(FullScreenQuad.geometry, material);
  }

  public get material() { return this.mesh.material as Three.Material; }
  public set material(value: Three.Material) { this.mesh.material = value; }

  public render(renderer: Three.WebGLRenderer) {
    renderer.render(this.mesh as any, FullScreenQuad.camera);
  }
}

export class ShaderPass extends Pass {
  public textureID: string;
  public uniforms: { [uniform: string]: Three.IUniform; };
  public material: Three.ShaderMaterial;
  public fsQuad: FullScreenQuad;
  constructor(shader: Shader, textureID?: string) {
    super();
    this.textureID = (textureID !== undefined) ? textureID : "tDiffuse";

    if (shader instanceof Three.ShaderMaterial) {
      this.uniforms = shader.uniforms;
      this.material = shader;
    } else if (shader) {
      this.uniforms = Three.UniformsUtils.clone(shader.uniforms);
      this.material = new Three.ShaderMaterial({
        defines: Object.assign({}, shader.defines),
        uniforms: this.uniforms,
        vertexShader: shader.vertexShader,
        fragmentShader: shader.fragmentShader
      });
    }

    this.fsQuad = new FullScreenQuad(this.material);
  };

	public render(renderer: Three.WebGLRenderer, writeBuffer: XCXCBuffer, readBuffer: XCXCBuffer, deltaTime: number, maskActive: boolean) {
		if ( this.uniforms[ this.textureID ] ) {
			this.uniforms[ this.textureID ].value = readBuffer.texture;
		}

		this.fsQuad.material = this.material;

		if ( this.renderToScreen ) {
			renderer.setRenderTarget( null );
			this.fsQuad.render( renderer );
		} else {
			renderer.setRenderTarget( writeBuffer );
			// TODO: Avoid using autoClear properties, see https://github.com/mrdoob/three.js/pull/15571#issuecomment-465669600
			if ( this.clear ) renderer.clear( renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil );
			this.fsQuad.render( renderer );
		}
	}
}

const CopyShader: Shader = {
	uniforms: {
		"tDiffuse": { value: null },
		"opacity":  { value: 1.0 }
	},
	vertexShader: [
		"varying vec2 vUv;",
		"void main() {",
			"vUv = uv;",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
		"}"
	].join( "\n" ),
	fragmentShader: [
		"uniform float opacity;",
		"uniform sampler2D tDiffuse;",
		"varying vec2 vUv;",
		"void main() {",
			"vec4 texel = texture2D( tDiffuse, vUv );",
			"gl_FragColor = opacity * texel;",
		"}"
	].join( "\n" )
};

/**
 * @author zz85 / http://www.lab4games.net/zz85/blog
 *
 * Two pass Gaussian blur filter (horizontal and vertical blur shaders)
 * - described in http://www.gamerendering.com/2008/10/11/gaussian-blur-filter-shader/
 *   and used in http://www.cake23.de/traveling-wavefronts-lit-up.html
 *
 * - 9 samples per pass
 * - standard deviation 2.7
 * - "h" and "v" parameters should be set to "1 / width" and "1 / height"
 */
export const HorizontalBlurShader: Shader = {
	uniforms: {
		"tDiffuse": { value: null },
		"h":        { value: 1.0 / 512.0 }
	},
	vertexShader: [
		"varying vec2 vUv;",
		"void main() {",
			"vUv = uv;",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
		"}"
	].join( "\n" ),
	fragmentShader: [
		"uniform sampler2D tDiffuse;",
		"uniform float h;",
		"varying vec2 vUv;",
		"void main() {",
			"vec4 sum = vec4( 0.0 );",
			"sum += texture2D( tDiffuse, vec2( vUv.x - 4.0 * h, vUv.y ) ) * 0.051;",
			"sum += texture2D( tDiffuse, vec2( vUv.x - 3.0 * h, vUv.y ) ) * 0.0918;",
			"sum += texture2D( tDiffuse, vec2( vUv.x - 2.0 * h, vUv.y ) ) * 0.12245;",
			"sum += texture2D( tDiffuse, vec2( vUv.x - 1.0 * h, vUv.y ) ) * 0.1531;",
			"sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y ) ) * 0.1633;",
			"sum += texture2D( tDiffuse, vec2( vUv.x + 1.0 * h, vUv.y ) ) * 0.1531;",
			"sum += texture2D( tDiffuse, vec2( vUv.x + 2.0 * h, vUv.y ) ) * 0.12245;",
			"sum += texture2D( tDiffuse, vec2( vUv.x + 3.0 * h, vUv.y ) ) * 0.0918;",
			"sum += texture2D( tDiffuse, vec2( vUv.x + 4.0 * h, vUv.y ) ) * 0.051;",
			"gl_FragColor = sum;",
		"}"
	].join( "\n" )
};

/**
 * @author zz85 / http://www.lab4games.net/zz85/blog
 *
 * Two pass Gaussian blur filter (horizontal and vertical blur shaders)
 * - described in http://www.gamerendering.com/2008/10/11/gaussian-blur-filter-shader/
 *   and used in http://www.cake23.de/traveling-wavefronts-lit-up.html
 *
 * - 9 samples per pass
 * - standard deviation 2.7
 * - "h" and "v" parameters should be set to "1 / width" and "1 / height"
 */

export const VerticalBlurShader: Shader = {
	uniforms: {
		"tDiffuse": { value: null },
		"v":        { value: 1.0 / 512.0 }
	},
	vertexShader: [
		"varying vec2 vUv;",
		"void main() {",
			"vUv = uv;",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
		"}"
	].join( "\n" ),
	fragmentShader: [
		"uniform sampler2D tDiffuse;",
		"uniform float v;",
		"varying vec2 vUv;",
		"void main() {",
			"vec4 sum = vec4( 0.0 );",
			"sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 4.0 * v ) ) * 0.051;",
			"sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 3.0 * v ) ) * 0.0918;",
			"sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 2.0 * v ) ) * 0.12245;",
			"sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 1.0 * v ) ) * 0.1531;",
			"sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y ) ) * 0.1633;",
			"sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 1.0 * v ) ) * 0.1531;",
			"sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 2.0 * v ) ) * 0.12245;",
			"sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 3.0 * v ) ) * 0.0918;",
			"sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 4.0 * v ) ) * 0.051;",
			"gl_FragColor = sum;",
		"}"
	].join( "\n" )
};

/**
 * @author alteredq / http://alteredqualia.com/
 */
export class RenderPass extends Pass {
	public scene: Three.Scene;
	public camera: Three.Camera;
	public overrideMaterial: Three.Material | null;
	public clearColor: Three.Color | undefined;
	public clearAlpha: number;
	public clearDepth: boolean;

	constructor(scene: Three.Scene, camera: Three.Camera, overrideMaterial?: Three.Material | null, clearColor?: Three.Color, clearAlpha?: number) {
		super();
		this.scene = scene;
		this.camera = camera;
		this.overrideMaterial = overrideMaterial || null;
		this.clearColor = clearColor;
		this.clearAlpha = ( clearAlpha !== undefined ) ? clearAlpha : 0;
		this.clear = true;
		this.clearDepth = false;
		this.needsSwap = false;
	}

	public render(renderer: Three.WebGLRenderer, writeBuffer: XCXCBuffer, readBuffer: XCXCBuffer, deltaTime: number, maskActive: boolean) {
		var oldAutoClear = renderer.autoClear;
		renderer.autoClear = false;
		this.scene.overrideMaterial = this.overrideMaterial;
		var oldClearColor, oldClearAlpha;
		if ( this.clearColor ) {
			oldClearColor = renderer.getClearColor().getHex();
			oldClearAlpha = renderer.getClearAlpha();
			renderer.setClearColor( this.clearColor, this.clearAlpha );
		}
		if ( this.clearDepth ) {
			renderer.clearDepth();
		}

		renderer.setRenderTarget( this.renderToScreen ? null : readBuffer );

		// TODO: Avoid using autoClear properties, see https://github.com/mrdoob/three.js/pull/15571#issuecomment-465669600
		if ( this.clear ) renderer.clear( renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil );
		renderer.render( this.scene, this.camera );

		if ( this.clearColor ) {
			renderer.setClearColor( oldClearColor || 0, oldClearAlpha );
		}

		this.scene.overrideMaterial = null;
		renderer.autoClear = oldAutoClear;
	}
}
