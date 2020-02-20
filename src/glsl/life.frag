#ifdef GL_ES
precision highp float;
#endif

#define PI 3.14159
#define STEP_SIZE 1.1
#define SENSOR_DISTANCE_MULTIPLIER 9.
#define SENSOR_ANGLE (22.5/360. * 2. * PI)
#define ROTATE_ANGLE (45./360. * 2. * PI)
#define FORWARD_ROTATE_THRESHOLD 1.

#pragma glslify: random = require(glsl-random)

uniform vec2 resolution;
uniform sampler2D simulation_texture;
uniform sampler2D deposit_texture;

vec4 get_simulation_value(vec2 coords) {
	return texture2D(simulation_texture, coords);
}

float get_deposit_value(vec2 coords) {
	return length(texture2D(deposit_texture, coords).rgb);
}

float relative_angle_to_rads(float angle) {
	return 2. * PI * angle;
}

/**
 * Get the offset a cell will move in one step moving at the given angle (which must be in radians).
 */
vec2 get_position_offset_from_angle(vec2 position, float angle) {
	vec2 step_coeff = vec2(STEP_SIZE)/resolution;

	return step_coeff * vec2(cos(angle), sin(angle));
}

/**
 * Get the angle for the cell to move to after observing all of the sensors.
 */
float get_movement_angle(vec2 current_position, float current_angle) {
	vec2 forward_sensor_pos = current_position + SENSOR_DISTANCE_MULTIPLIER * get_position_offset_from_angle(current_position, current_angle);
	vec2 left_sensor_pos = current_position + SENSOR_DISTANCE_MULTIPLIER * get_position_offset_from_angle(current_position, current_angle - SENSOR_ANGLE);
	vec2 right_sensor_pos = current_position + SENSOR_DISTANCE_MULTIPLIER * get_position_offset_from_angle(current_position, current_angle + SENSOR_ANGLE);
	float forward_sensor_value = get_deposit_value(forward_sensor_pos);
	float left_sensor_value = get_deposit_value(left_sensor_pos);
	float right_sensor_value = get_deposit_value(right_sensor_pos);

	if (forward_sensor_value > left_sensor_value && forward_sensor_value > right_sensor_value) {
		return current_angle;
	} else if (forward_sensor_value < left_sensor_value && forward_sensor_value < right_sensor_value) {
		// Randomly add or subtract ROTATION_ANGLE
		return (2. * step(0.5, random(gl_FragCoord.xy/resolution)) - 1.) * current_angle * ROTATE_ANGLE;
	} else if (left_sensor_value < right_sensor_value) {
		return current_angle + ROTATE_ANGLE;
	} else if (left_sensor_value > right_sensor_value) {
		return current_angle - ROTATE_ANGLE;
	} else {
		return 0.;
	}
}

void main() {
	// res holds the current cell, which will be augmented to its new position.
	// r represents x position, g represents y position, b represents angle and a is a boolean representing if the cell
	// is part of the simulation.
	vec4 res = get_simulation_value(gl_FragCoord.xy/resolution);

	float cell_angle = relative_angle_to_rads(res.b);
	float movement_angle = get_movement_angle(res.xy, cell_angle);
	vec2 offset = get_position_offset_from_angle(res.xy, movement_angle);
	vec2 new_pos = res.xy + offset;
	res.r = fract(new_pos.x);
	res.g = fract(new_pos.y);

	// If a pixel was already not part of the simulation, we don't want to put it into the simulation.
	// This step function shouldn't be needed, but due to floating point precision issues, simply doing a *= res.a will not work.
	res *= step(0., res.a);

	gl_FragColor = res;
}
