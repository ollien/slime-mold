import reglModule, { Framebuffer } from 'regl'; // eslint-disable-line no-unused-vars
import dat from 'dat.gui';
import lodash from 'lodash';
import renderTextureShaderSource from '@shader/rendertexture.frag'; // eslint-disable-line import/no-unresolved
import renderCellShaderSource from '@shader/rendercells.frag'; // eslint-disable-line import/no-unresolved
import depositShaderSource from '@shader/deposit.frag'; // eslint-disable-line import/no-unresolved
import renderCellVertexShaderSource from '@shader/rendercells.vert'; // eslint-disable-line import/no-unresolved
import lifeShaderSource from '@shader/life.frag'; // eslint-disable-line import/no-unresolved
import triangleVertexShaderSource from '@shader/triangles.vert'; // eslint-disable-line import/no-unresolved
import { Flipper } from './flipper';

const CANVAS_ID = 'gl';
const CELL_PERCENTAGE = 0.10;
const RENDER_TRIANGLE_VERTS = [
	[-1, -1],
	[1, -1],
	[-1, 1],
	[-1, 1],
	[1, -1],
	[1, 1],
];

// Represents properties that can be varied in the simulation.
interface SimulationProperties {
	stepSize: number,
	sensorDistance: number,
	sensorAngle: number,
	rotateAngle: number,
	color: [number, number, number],
	dragPosition: [number, number],
	disturbRadius: number,
	paused: boolean,
	pullInwards: boolean,
}

function setCanvasSize(canvas: HTMLCanvasElement): void {
	const html = document.querySelector('html');
	/* eslint-disable no-param-reassign */
	canvas.height = html.clientHeight - 4;
	canvas.width = html.clientWidth;
	/* eslint-enable no-param-reassign */
}

/**
 * Generates random up to n random pixels of the following form.
 * 	r: x coordinate
 * 	g: y coordinate
 * 	b: z coordinate
 *  a: 1 if the pixel is part of the simulation, 0 otherwise.
 *
 * @param numRandomItems The number of items to generate. Must be <= length.
 * @param length The size of the array to generate. Will be padded with zeroes.
 */
function makeRandomData(numRandomItems: number, length: number): number[] {
	if (numRandomItems > length) {
		throw Error('Attempted to generate more random items than array length');
	}

	const values = Array(length).fill(0).map((_, index): [number, number, number, number] => {
		if (index >= numRandomItems) {
			return [0, 0, 0, 0];
		}

		return [
			Math.random(),
			Math.random(),
			Math.random(),
			1,
		];
	});

	return lodash.flatten(values);
}

/**
 * Sets up the GUI needed to control the simulation.
 *
 * @param controlObject The object whose properties will control the simulation.
 */
function setupSimulationGUI(controlObject: SimulationProperties) {
	const gui = new dat.GUI();
	gui.add(controlObject, 'stepSize', 0, 10);
	gui.add(controlObject, 'sensorDistance', 0, 50);
	gui.add(controlObject, 'sensorAngle', 0, 90);
	gui.add(controlObject, 'rotateAngle', 0, 90);
	gui.add(controlObject, 'disturbRadius', 0, 64);
	gui.add(controlObject, 'paused');
	gui.addColor(controlObject, 'color');
}

/**
 * Sets up an event to update the controlObject with the current drag position of the mouse.
 *
 * @param eventTarget The element to drag on
 * @param controlObject The object whose properties will control the simulation.
 */
function setupMouseDragControl(eventTarget: HTMLElement, controlObject: SimulationProperties) {
	function assignPositionToController(event: MouseEvent) {
		const { height, width } = eventTarget.getBoundingClientRect();
		// eslint-disable-next-line no-param-reassign
		controlObject.dragPosition = [
			event.x / width,
			// Our shader expects zero to be the bottom, but the event has zero be the top.
			1 - event.y / height,
		];
	}

	function assignDisturbDirectionToController(event: KeyboardEvent) {
		// eslint-disable-next-line no-param-reassign
		controlObject.pullInwards = event.shiftKey;
	}

	document.addEventListener('keydown', assignDisturbDirectionToController);
	document.addEventListener('keyup', assignDisturbDirectionToController);

	eventTarget.addEventListener('mousedown', assignPositionToController);
	eventTarget.addEventListener('mousemove', (event: MouseEvent) => {
		if (event.buttons & 1) {
			assignPositionToController(event);
		}
	});

	eventTarget.addEventListener('mouseup', () => {
		// eslint-disable-next-line no-param-reassign
		controlObject.dragPosition = [-1, -1];
	});
}

/**
 * Make one vertex for each cell, with coordinates for each cell.
 *
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
	const simulationProperties: SimulationProperties = {
		stepSize: 1.1,
		sensorDistance: 9,
		sensorAngle: 22.5,
		rotateAngle: 45,
		color: [255, 255, 255],
		dragPosition: [-1, -1],
		disturbRadius: 32,
		paused: false,
		pullInwards: false,
	};

	setCanvasSize(canvas);
	setupSimulationGUI(simulationProperties);
	setupMouseDragControl(canvas, simulationProperties);

	const regl = reglModule({ canvas, extensions: ['OES_texture_float', 'WEBGL_color_buffer_float'] });

	/**
	 *  Makes an FBO with the settings needed to run the simulation.
	 * @param data The data to use for the FBO
	 */
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

	const numPixels = canvas.width * canvas.height;
	const data = makeRandomData(numPixels * CELL_PERCENTAGE, numPixels);
	const simulationStates = new Flipper<Framebuffer>(makeFBO(data), makeFBO(data));
	const emptyData = Array(canvas.width * canvas.height * 4).fill(0);
	const cellStates = new Flipper<Framebuffer>(makeFBO(emptyData), makeFBO(emptyData));
	const depositStates = new Flipper<Framebuffer>(makeFBO(emptyData), makeFBO(emptyData));

	// Runs the simulation's calculations, calculating cell positions as needed.
	const runSimulation = regl({
		frag: lifeShaderSource,
		uniforms: {
			deposit_texture: (): Framebuffer => depositStates.peekBack(),
			simulation_texture: (): Framebuffer => simulationStates.peekFront(),
			// The type definitions for the properties state we must specify the key in the argument and the generic.
			step_size: regl.prop<SimulationProperties, 'stepSize'>('stepSize'),
			sensor_distance_multiplier: regl.prop<SimulationProperties, 'sensorDistance'>('sensorDistance'),
			sensor_angle_deg: regl.prop<SimulationProperties, 'sensorAngle'>('sensorAngle'),
			rotate_angle_deg: regl.prop<SimulationProperties, 'rotateAngle'>('rotateAngle'),
			mouse_drag_position: regl.prop<SimulationProperties, 'dragPosition'>('dragPosition'),
			disturb_radius: regl.prop<SimulationProperties, 'disturbRadius'>('disturbRadius'),
			paused: regl.prop<SimulationProperties, 'paused'>('paused'),
			pull_inwards: regl.prop<SimulationProperties, 'pullInwards'>('pullInwards'),
		},
		framebuffer: (): Framebuffer => simulationStates.peekBack(),
	});

	const cellVertices = makeCellVertices(canvas.width, canvas.height);
	// Renders the cells each as a vertex on the screen
	const renderCells = regl({
		frag: renderCellShaderSource,
		vert: renderCellVertexShaderSource,
		framebuffer: (): Framebuffer => cellStates.peekBack(),
		attributes: {
			a_position: cellVertices,
		},
		count: cellVertices.length,
		uniforms: {
			resolution: [canvas.width, canvas.height],
			simulation_texture: (): Framebuffer => simulationStates.peekFront(),
		},
		primitive: 'points',
	});

	// Renders the deposits from the cells, which is just the cells fed back into a texture.
	const renderDeposits = regl({
		frag: depositShaderSource,
		framebuffer: (): Framebuffer => depositStates.peekBack(),
		uniforms: {
			cell_texture: (): Framebuffer => cellStates.peekFront(),
			feedback_texture: (): Framebuffer => depositStates.peekFront(),
		},
	});

	// Renders the entire simulation to the screen
	const renderSimulation = regl({
		frag: renderTextureShaderSource,
		uniforms: {
			color: regl.prop<SimulationProperties, 'color'>('color'),
			luma_texture: (): Framebuffer => depositStates.peekFront(),
		},
	});


	regl.frame(() => {
		// Make sure we clear any cells that existed on the last frame
		regl.clear({ color: [0, 0, 0, 0], framebuffer: cellStates.peekBack() });

		regl({
			// All commands (except for renderCells) will use this vertex shader with the triangle attributes
			vert: triangleVertexShaderSource,
			attributes: {
				a_position: RENDER_TRIANGLE_VERTS,
			},
			count: RENDER_TRIANGLE_VERTS.length,
			// All commands will use the resolution uniform
			uniforms: {
				resolution: [canvas.width, canvas.height],
			},
			// None of the shaders need depth calculations
			depth: { enable: false },
		})(() => {
			// Pass the properties to the simulation as regl properties
			runSimulation(simulationProperties);
			// Render the cells as verts to the framebuffer
			renderCells();
			// Render and fade the old cells
			renderDeposits();
			// Render the whole thing to the screen.
			renderSimulation(simulationProperties);
		});

		// Flip the buffers
		simulationStates.flip();
		cellStates.flip();
		depositStates.flip();
	});
});
