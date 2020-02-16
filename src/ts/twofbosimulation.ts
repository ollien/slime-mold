import triangleShaderSource from '@shader/triangles.vert'; // eslint-disable-line import/no-unresolved
import glFBO from 'gl-fbo';
import glShader from 'gl-shader';
import { Flipper } from './flipper';
import { Framebuffer, Shader } from './stackglaliases'; // eslint-disable-line no-unused-vars

/**
 * Represents a Simulation with a "read" and "write" FBO.
 */
export default class TwoFBOSimulation {
	// Represents the gl-now instance used for the FBO
	// No type declaration for gl-now, and building one manually would take more time than it is worth for the time
	// I have for this assignment
	private readonly glShell: any;
	private readonly renderShaderSource: string;
	private readonly simulationShaderSource: string;
	private renderShader: Shader;
	private simulationShader: Shader;
	private frameBuffers: Flipper<Framebuffer>;

	/**
	 * @param glShell The glNow shell to use
	 * @param renderShaderSource The GLSL source of the shader to use to render the simulation
	 * @param simulationShaderSource GLSL source of the The shader to use to run the simulation
	 */
	constructor(glShell: any, renderShaderSource: string, simulationShaderSource: string) {
		this.glShell = glShell;
		this.renderShaderSource = renderShaderSource;
		this.simulationShaderSource = simulationShaderSource;
	}

	/**
	 * Get the Framebuffer that will be read from next.
	 */
	getNextReadFBO(): Framebuffer {
		return this.frameBuffers.peekFront();
	}

	/**
	 * Get the Framebuffer that will be written to next.
	 */
	getNextWriteFBO(): Framebuffer {
		return this.frameBuffers.peekBack();
	}

	/**
	 * Start the simulation
	 *
	 * @returns A promise that resolves when the simulation has been setup
	 */
	start(): Promise<void> {
		return new Promise((resolve: () => void) => {
			this.setupInitHook(resolve);
			this.setupTickHook();
			this.setupRenderHook();
		});
	}

	/**
	 * Setup a single shader as a glShader.
	 *
	 * @param shaderSource The source code of the shader
	 */
	private setupShader(shaderSource: string): Shader {
		return glShader(this.glShell.gl, triangleShaderSource, shaderSource);
	}

	/**
	 * Setup the hook for gl-init on the shell.
	 *
	 * @param callback A callback to be called after the init has completed.
	 */
	private setupInitHook(callback?: () => void): void {
		this.glShell.on('gl-init', () => {
			// eslint-disable-next-line prefer-destructuring
			const gl: WebGLRenderingContext = this.glShell.gl;

			this.frameBuffers = TwoFBOSimulation.makeFrameBufferFlipper(gl);
			this.simulationShader = this.setupShader(this.simulationShaderSource);
			this.renderShader = this.setupShader(this.renderShaderSource);

			gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
			const triangles = new Float32Array([
				-1, -1,
				1, -1,
				-1, 1,
				-1, 1,
				1, -1,
				1, 1,
			]);

			gl.bufferData(gl.ARRAY_BUFFER, triangles, gl.STATIC_DRAW);

			if (callback !== undefined) {
				callback();
			}
		});
	}

	/**
	 * Setup the tick hook on the shell. This will run the simulation shader.
	 */
	private setupTickHook(): void {
		this.glShell.on('tick', () => {
			if (this.simulationShader == null) {
				throw new Error('Simulation tick attempted with unset simulation shader');
			}

			// eslint-disable-next-line prefer-destructuring
			const gl: WebGLRenderingContext = this.glShell.gl;
			const lastBuffer = this.frameBuffers.peekFront();
			const nextBuffer = this.frameBuffers.peekBack();

			nextBuffer.bind();
			this.simulationShader.bind();
			this.simulationShader.uniforms.simulation_texture = lastBuffer.color[0].bind();
			this.simulationShader.uniforms.resolution = lastBuffer.shape;

			this.simulationShader.attributes.a_position.pointer();
			gl.drawArrays(gl.TRIANGLES, 0, 6);

			this.frameBuffers.flip();
		});
	}

	/**
	 * Setup the render hook on the shell. This will run the render shader.
	 */
	private setupRenderHook(): void {
		this.glShell.on('gl-render', () => {
			if (this.renderShader === null) {
				throw new Error('Render attempted with unset render shader');
			}

			// eslint-disable-next-line prefer-destructuring
			const gl: WebGLRenderingContext = this.glShell.gl;
			const lastBuffer = this.frameBuffers.peekFront();

			this.renderShader.bind();
			// Copy the existing picture in the framebuffer to a sampler uniform
			this.renderShader.uniforms.uSampler = lastBuffer.color[0].bind();
			// Get the resolution of the buffer,a nd pass it as a uniform
			this.renderShader.uniforms.resolution = lastBuffer.shape;

			this.renderShader.attributes.a_position.pointer();
			gl.drawArrays(gl.TRIANGLES, 0, 6);
		});
	}

	/**
	 * Make the flipper for the Framebuffer
	 * @param gl The context to make the FBO for.
	 */
	private static makeFrameBufferFlipper(gl: WebGLRenderingContext): Flipper<Framebuffer> {
		return new Flipper<Framebuffer>(
			glFBO(gl, [gl.drawingBufferWidth, gl.drawingBufferHeight]),
			glFBO(gl, [gl.drawingBufferWidth, gl.drawingBufferHeight]),
		);
	}
}
