import reglModule, { Framebuffer } from 'regl'; // eslint-disable-line no-unused-vars
import lodash from 'lodash';
import renderTextureShaderSource from '@shader/rendertexture.frag'; // eslint-disable-line import/no-unresolved
import renderCellShaderSource from '@shader/rendercells.frag'; // eslint-disable-line import/no-unresolved
import depositShaderSource from '@shader/deposit.frag'; // eslint-disable-line import/no-unresolved
import renderCellVertexShaderSource from '@shader/rendercells.vert'; // eslint-disable-line import/no-unresolved
import lifeShaderSource from '@shader/life.frag'; // eslint-disable-line import/no-unresolved
import triangleVertexShaderSource from '@shader/triangles.vert'; // eslint-disable-line import/no-unresolved
import { Flipper } from './flipper';

const CANVAS_ID = 'gl';
const NUM_AGENTS = 50;
const RENDER_TRIANGLE_VERTS = [
	[-1, -1],
	[1, -1],
	[-1, 1],
	[-1, 1],
	[1, -1],
	[1, 1],
];

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

	const regl = reglModule({ canvas, extensions: ['OES_texture_float', 'WEBGL_color_buffer_float'] });
	function makeFBO(data: number[]): Framebuffer {
		const { width, height } = canvas;
		return regl.framebuffer({
			width,
			height,
			colorType: 'float',
			color: regl.texture({
				width,
				height,
				data,
				format: 'rgba',
				// unit8 is not precise enough for the angle calculations that are required.
				type: 'float',
			}),
			depthStencil: false,
		});
	}

	const data = makeRandomData(canvas.width, canvas.height);
	const simulationStates = new Flipper<Framebuffer>(makeFBO(data), makeFBO(data));
	const emptyData = Array(canvas.width * canvas.height * 4).fill(0);
	const cellStates = new Flipper<Framebuffer>(makeFBO(emptyData), makeFBO(emptyData));
	const depositStates = new Flipper<Framebuffer>(makeFBO(emptyData), makeFBO(emptyData));

	const runSimulation = regl({
		frag: lifeShaderSource,
		vert: triangleVertexShaderSource,
		attributes: {
			a_position: RENDER_TRIANGLE_VERTS,
		},
		count: RENDER_TRIANGLE_VERTS.length,
		uniforms: {
			simulation_texture: (): Framebuffer => simulationStates.peekFront(),
			resolution: [canvas.width, canvas.height],
		},
		framebuffer: (): Framebuffer => simulationStates.peekBack(),
	});

	const cellVertices = makeCellVertices(canvas.width, canvas.height);
	const renderCells = regl({
		frag: renderCellShaderSource,
		vert: renderCellVertexShaderSource,
		framebuffer: (): Framebuffer => cellStates.peekBack(),
		attributes: {
			a_position: cellVertices,
		},
		depth: { enable: false },
		uniforms: {
			simulation_texture: (): Framebuffer => simulationStates.peekFront(),
			resolution: [canvas.width, canvas.height],
		},
		count: cellVertices.length,
		primitive: 'points',
	});

	const renderDeposits = regl({
		frag: depositShaderSource,
		vert: triangleVertexShaderSource,
		framebuffer: (): Framebuffer => depositStates.peekBack(),
		attributes: {
			a_position: RENDER_TRIANGLE_VERTS,
		},
		count: RENDER_TRIANGLE_VERTS.length,
		uniforms: {
			cell_texture: (): Framebuffer => cellStates.peekFront(),
			feedback_texture: (): Framebuffer => depositStates.peekFront(),
			resolution: [canvas.width, canvas.height],
		},
	});

	const renderSimulation = regl({
		frag: renderTextureShaderSource,
		vert: triangleVertexShaderSource,
		attributes: {
			a_position: RENDER_TRIANGLE_VERTS,
		},
		count: RENDER_TRIANGLE_VERTS.length,
		uniforms: {
			tex: (): Framebuffer => depositStates.peekFront(),
			resolution: [canvas.width, canvas.height],
		},
		depth: { enable: false },
	});


	regl.frame(() => {
		runSimulation();
		renderCells();
		renderDeposits();
		renderSimulation();
		simulationStates.flip();
		cellStates.flip();
		depositStates.flip();
	});
});
