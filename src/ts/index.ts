import * as glNow from 'gl-now';
import ndarray from 'ndarray';
import renderShaderSource from '@shader/render.frag'; // eslint-disable-line import/no-unresolved
import lifeShaderSource from '@shader/life.frag'; // eslint-disable-line import/no-unresolved
import TwoFBOSimulation from './twofbosimulation';

/**
 * Make a random array of white/black pixels (represented as 255/0)
 * @param rows The number of rows to put in the result.
 * @param cols The number of cols to put in the result.
 */
function makeRandomData(rows: number, cols: number): ndarray<number> {
	if (rows < 0 || cols < 0) {
		throw Error('Rows and Cols must be positive');
	}

	const values: number[] = [];
	for (let i = 0; i < rows * cols * 4; i++) {
		if (i % 4 === 3) {
			values[i] = 255;
		} else {
			values[i] = Math.random() > 0.75 ? 255 : 0;
		}
	}

	return ndarray(new Uint8Array(values), [rows, cols, 4]);
}

/**
 * Setup the simulation with a random pattern.
 *
 * @param gl The WebGL rendering context in use.
 * @param simulation The simulation to write to the FBO of.
 */
function setupSimulationPattern(gl: WebGLRenderingContext, simulation: TwoFBOSimulation): void {
	const nextFBO = simulation.getNextReadFBO();
	const randomData = makeRandomData(gl.drawingBufferWidth, gl.drawingBufferHeight);
	nextFBO.color[0].setPixels(randomData);
}

window.addEventListener('load', () => {
	const shell = glNow();
	const simulation = new TwoFBOSimulation(shell, renderShaderSource, lifeShaderSource);
	simulation.start().then(() => {
		setupSimulationPattern(shell.gl, simulation);
	});
});
