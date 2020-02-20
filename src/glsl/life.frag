#ifdef GL_ES
precision highp float;
#endif

#define PI 3.14159

#pragma glslify: random = require(glsl-random)

uniform float step_size;
uniform float sensor_distance_multiplier;
uniform float sensor_angle_deg;
uniform float rotate_angle_deg;
uniform vec2 mouse_drag_position;
uniform float disturb_radius;
uniform bool paused;

uniform vec2 resolution;
uniform sampler2D simulation_texture;
uniform sampler2D deposit_texture;

vec4 get_simulation_value(vec2 coords) {
	return texture2D(simulation_texture, coords);
}

float get_deposit_value(vec2 coords) {
	return length(texture2D(deposit_texture, mod(coords, 1.)).rgb);
}

float relative_angle_to_rads(float angle) {
	return 2. * PI * angle;
}

float degrees_to_rads(float angle) {
	return angle / 180. * PI;
}

/**
 * Get the offset a cell will move in one step moving at the given angle (which must be in radians).
 */
vec2 get_position_offset_from_angle(vec2 position, float angle) {
	vec2 step_coeff = vec2(step_size)/resolution;

	return step_coeff * vec2(cos(angle), sin(angle));
}

/**
 * Get the angle for the cell to move to after observing all of the sensors.
 */
float get_movement_angle(vec2 current_position, float current_angle) {
	float sensor_angle = degrees_to_rads(sensor_angle_deg);
	float rotate_angle = degrees_to_rads(rotate_angle_deg);
	vec2 forward_sensor_pos = current_position + sensor_distance_multiplier * get_position_offset_from_angle(current_position, current_angle);
	vec2 left_sensor_pos = current_position + sensor_distance_multiplier * get_position_offset_from_angle(current_position, current_angle - sensor_angle);
	vec2 right_sensor_pos = current_position + sensor_distance_multiplier * get_position_offset_from_angle(current_position, current_angle + sensor_angle);
	float forward_sensor_value = get_deposit_value(forward_sensor_pos);
	float left_sensor_value = get_deposit_value(left_sensor_pos);
	float right_sensor_value = get_deposit_value(right_sensor_pos);

	if (forward_sensor_value > left_sensor_value && forward_sensor_value > right_sensor_value) {
		return current_angle;
	} else if (forward_sensor_value < left_sensor_value && forward_sensor_value < right_sensor_value) {
		// Randomly add or subtract ROTATION_ANGLE
		return (2. * step(0.5, random(gl_FragCoord.xy/resolution)) - 1.) * current_angle * rotate_angle;
	} else if (left_sensor_value < right_sensor_value) {
		return current_angle + rotate_angle;
	} else if (left_sensor_value > right_sensor_value) {
		return current_angle - rotate_angle;
	} else {
		return 0.;
	}
}

vec2 get_offset_from_disturb_center(vec2 cell_pos) {
	if (mouse_drag_position == vec2(-1.)) {
		return vec2(-1.);
	}

	return vec2(cell_pos.x - mouse_drag_position.x, cell_pos.y - mouse_drag_position.y);
}

void main() {
	// res holds the current cell, which will be augmented to its new position.
	// r represents x position, g represents y position, b represents angle and a is a boolean representing if the cell
	// is part of the simulation.
	vec4 res = get_simulation_value(gl_FragCoord.xy/resolution);

	float cell_angle = relative_angle_to_rads(res.b);
	float movement_angle = get_movement_angle(res.xy, cell_angle);
	vec2 offset = paused ? vec2(0.) : get_position_offset_from_angle(res.xy, movement_angle);
	vec2 disturb_offset = get_offset_from_disturb_center(res.xy);
	if (disturb_offset != vec2(-1.) && length(disturb_offset) < length(vec2(disturb_radius)/resolution)) {
		// Divide this by sixteen so it takes a few frames for things to move out of the way
		float disturb_multiplier = disturb_radius/16.;
		offset = disturb_multiplier/resolution * vec2(sign(disturb_offset.x), sign(disturb_offset.y));
	}

	vec2 new_pos = res.xy + offset;
	res.r = mod(new_pos.x, 1.);
	res.g = mod(new_pos.y, 1.);

	// If a pixel was already not part of the simulation, we don't want to put it into the simulation.
	// This step function shouldn't be needed, but due to floating point precision issues, simply doing a *= res.a will not work.
	res *= step(0., res.a);

	gl_FragColor = res;
}
