#ifdef GL_ES
precision highp float;
#endif

#define PI 3.14159
#define STEP_SIZE 1.

uniform vec2 resolution;
uniform sampler2D simulation_texture;

vec4 get(vec2 coords) {
	vec2 scaled_coords = (coords + gl_FragCoord.xy)/resolution;
	return texture2D(simulation_texture, scaled_coords);
}

float relative_angle_to_rads(float angle) {
	return 2. * PI * angle;
}

void main() {
	// res holds the current cell, which will be augmented to its new position.
	// r represents x position, g represents y position, b represents angle and a is a boolean representing if the cell
	// is part of the simulation.
	vec4 res = get(vec2(0.));

	float cell_angle = relative_angle_to_rads(res.b);
	vec2 step_coeff = vec2(STEP_SIZE)/resolution;
	vec2 offset = step_coeff * vec2(cos(cell_angle), sin(cell_angle));
	res.r = mod(res.r + offset.x, 1.);
	res.g = mod(res.g + offset.y, 1.);

	// If a pixel was already not part of the simulation, we don't want to put it into the simulation.
	// This step function shouldn't be needed, but due to floating point precision issues, simply doing a *= res.a will not work.
	res *= step(0., res.a);

	gl_FragColor = res;
}
