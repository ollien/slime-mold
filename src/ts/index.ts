import reglModule, { Framebuffer } from 'regl'; // eslint-disable-line no-unused-vars
import lodash from 'lodash';
import renderTextureShaderSource from '@shader/rendertexture.frag'; // eslint-disable-line import/no-unresolved
import renderCellShaderSource from '@shader/rendercells.frag'; // eslint-disable-line import/no-unresolved
import renderCellVertexShaderSource from '@shader/rendercells.vert'; // eslint-disable-line import/no-unresolved
import lifeShaderSource from '@shader/life.frag'; // eslint-disable-line import/no-unresolved
import vertexShaderSource from '@shader/triangles.vert'; // eslint-disable-line import/no-unresolved
import { Flipper } from './flipper';

const CANVAS_ID = 'gl';
const NUM_AGENTS = 50;

function setCanvasSize(canvas: HTMLCanvasElement): void {
	const html = document.querySelector('html');
	/* eslint-disable no-param-reassign */
	canvas.height = html.clientHeight - 4;
	canvas.width = html.clientWidth;
	/* eslint-enable no-param-reassign */
}

/**
 * Generates random up to NUM_AGENTS random pixels of the following form.
 * 	r: x coordinate
 * 	g: y coordinate
 * 	b: z coordinate
 *  a: 255 if the pixel is part of the simulation, 0 otherwise.
 *
 * @param width The width of the data to write to.
 * @param height The height of the data to write to.
 */
function makeRandomData(width: number, height: number): number[] {
	const values = Array(width * height).fill(0).map((_, index): [number, number, number, number] => {
		if (index >= NUM_AGENTS) {
			return [0, 0, 0, 0];
		}

		return [
			Math.random() * 255,
			Math.random() * 255,
			Math.random() * 255,
			255,
		];
	});

	return lodash.flatten(values);
}

/**
 * Make one vertex for each cell, with coordinates for each cell.
 * @param width The width of the rendering output
 * @param height The height of the rendering output
 */
function makeCellVertices(width: number, height: number): [number, number][] {
	const res = [];
	for (let i = 0; i < width; i++) {
		for (let j = 0; j < height; j++) {
			res.push([i / width, j / width]);
		}
	}

	return res;
}

window.addEventListener('load', () => {
	const canvas = <HTMLCanvasElement>document.getElementById(CANVAS_ID);
	setCanvasSize(canvas);

	const regl = reglModule(`#${CANVAS_ID}`);
	function makeFBO(data: number[]): Framebuffer {
		const { width, height } = canvas;
		return regl.framebuffer({
			width,
			height,
			color: regl.texture({
				width,
				height,
				data,
			}),
			depthStencil: false,
		});
	}

	const data = makeRandomData(canvas.width, canvas.height);
	const states = new Flipper<Framebuffer>(makeFBO(data), makeFBO(data));
	const runSimulation = regl({
		frag: lifeShaderSource,
		framebuffer: (): Framebuffer => states.peekBack(),
	});

	const renderSimulation = regl({
		frag: renderTextureShaderSource,
		vert: vertexShaderSource,
		attributes: {
			a_position: [
				[-1, -1],
				[1, -1],
				[-1, 1],
				[-1, 1],
				[1, -1],
				[1, 1],
			],
		},
		uniforms: {
			simulation_texture: (): Framebuffer => states.peekFront(),
			resolution: [canvas.width, canvas.height],
		},
		depth: { enable: false },
		count: 6,
	});

	const cellVertices = makeCellVertices(canvas.width, canvas.height);
	const renderCells = regl({
		frag: renderCellShaderSource,
		vert: renderCellVertexShaderSource,
		attributes: {
			// a_position: cellVertices,
			a_position: cellVertices,
		},
		depth: { enable: false },
		uniforms: { simulation_texture: states.peekFront() },
		count: cellVertices.length,
		primitive: 'points',
	});

	regl.frame(() => {
		renderSimulation(() => {
			regl.draw();
			runSimulation();
			states.flip();
		});
		renderCells();
	});
});
