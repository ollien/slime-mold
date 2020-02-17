#ifdef GL_ES
	precision mediump float;
#endif

#define PI 3.14159

uniform vec2 resolution;
uniform sampler2D simulation_texture;

// Default values taken from paper
#define SENSOR_ANGLE 45.
#define ROTATION_ANGLE 45.
#define OFFSET 9.
#define THRESHOLD 0.
#define STEP_SIZE_VEC 1./resolution
#define STEP_SIZE length(STEP_SIZE_VEC)

// Paper said this should be 0.1, but that was found to be a fading a bit quickly.
#define DECAY_FACTOR (1.-0.05)


vec2 uvN() {
	return gl_FragCoord.xy / resolution;
}

/**
 * Convert a coordinate that's in relative pixels to the current pixel to one within the [0, 1] bounds.
 */
vec2 scale_relative_coords(vec2 coords) {
	return (coords + gl_FragCoord.xy) / resolution;
}

/**
 * Gets a pixel from the simulation texture.
 * In this texture, r represents the "life value", g represents the rotation (from 0 to 1), and b represents whether or
 * not it is "alive" or not (0 if the particle is a deposit, 1 otherwise.)
 */
vec3 get(vec2 coords) {
	vec2 scaled_coords = scale_relative_coords(coords);
	// Wraps toroidily
	return texture2D(simulation_texture, mod(scaled_coords, resolution)).rgb;
}

/**
 * Converts an angle from between 0 and 1 to radians.
 */
float relative_angle_to_rads(float angle) {
	return 2. * PI * angle;
}

/**
 * Get the coordinate that is in the direction of the given angle from the given position, and is one unit away.
 */
vec2 get_coord_from_angle(vec2 pos, float angle) {
	float angle_in_rads = relative_angle_to_rads(angle);

	return pos + STEP_SIZE_VEC * vec2(cos(angle_in_rads), sin(angle_in_rads));
}

/**
 * Check if the candidate's blue component is nonzero.
 */
bool is_alive(vec3 candidate) {
	return candidate.b > 0.;
}

/**
 * Check if the candidate has any value that can be displayed.
 */
bool has_displayable_value(vec3 candidate) {
	return candidate.r > THRESHOLD;
}

/**
 * Checks ehether or not the given candidate cell can move.
 * This checks if the cell is alive and if it has a life value that will allow for movement.
 */
bool can_move(vec3 candidate) {
	return is_alive(candidate) && has_displayable_value(candidate);
}

// TODO: Try to reduce branching in this function. Built with branching for readability during initial stages.
vec3 get_new_value_from_movement() {
	vec3 self = get(vec2(0, 0));
	// If the cell is occupied, there's no chance of anything moving here.
	if (has_displayable_value(self)) {
		return self;
	}

	for (int i = -1; i <= 1; i++) {
		for (int j = -1; j <= 1; j++) {
			vec3 candidate = get(vec2(i, j));
			// Don't consider ourselves.
			if (i == 0 && j == 0) {
				continue;
			} else if (!can_move(candidate)) {
				continue;
			}

			vec2 candidate_position = scale_relative_coords(vec2(i, j));
			vec2 candidate_attempted_position = get_coord_from_angle(candidate_position, candidate.g);
			// Also tried doing this with distance, to no avail :(
			if (abs(candidate_attempted_position.x - uvN().x) < STEP_SIZE_VEC.x && abs(candidate_attempted_position.y - uvN().y) < STEP_SIZE_VEC.y) {
				return candidate;
			}
		}
	}

	return vec3(0.);
}

void main() {
	vec3 self = get(vec2(0.));
	vec3 val = get_new_value_from_movement();
	vec2 movement_pos = get_coord_from_angle(vec2(0.), self.g);
	if (has_displayable_value(self) && !is_alive(self)) {
		val = vec3(self.r * DECAY_FACTOR, self.g, 0.);
	} else if (has_displayable_value(self) && movement_pos != vec2(0.)) {
		// If this cell will move somewhere, set the "alive" component to zero.
		val = vec3(self.r, self.g, 0.);
	}

	gl_FragColor = vec4(val, 1.0);
}
