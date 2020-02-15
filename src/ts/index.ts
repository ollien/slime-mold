import * as glNow from 'gl-now';
import * as glShader from 'gl-shader';
import renderShaderSource from '@shader/render.frag'; // eslint-disable-line import/no-unresolved
import triangleShaderSource from '@shader/triangles.vert'; // eslint-disable-line import/no-unresolved

// Normally this is done in the require statement, but because we use ES6 syntax, we must create the shell for gl-now.
const shell = glNow();
// TODO: Make this not a global
let renderShader = null;

shell.on('gl-init', () => {
	// eslint-disable-next-line prefer-destructuring
	const gl: WebGLRenderingContext = shell.gl;

	renderShader = glShader(gl, triangleShaderSource, renderShaderSource);

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
});

let time = 0;
shell.on('gl-render', () => {
	// eslint-disable-next-line prefer-destructuring
	const gl: WebGLRenderingContext = shell.gl;

	renderShader.bind();
	renderShader.uniforms.time = time;
	renderShader.uniforms.resolution = [gl.drawingBufferWidth, gl.drawingBufferHeight];
	renderShader.attributes.a_position.pointer();
	gl.drawArrays(gl.TRIANGLES, 0, 6);
	time++;
});

window.addEventListener('load', () => {
});
