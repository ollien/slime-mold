#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 resolution;
uniform sampler2D simulation_texture;

int get(vec2 coords) {
	vec2 scaled_coords = (coords + gl_FragCoord.xy)/resolution;
	return int(
		texture2D(simulation_texture, scaled_coords).r
	);
}

void main() {
	int sum = get(vec2(-1, -1)) +
		get(vec2(-1,  0)) +
		get(vec2(-1,  1)) +
		get(vec2( 0, -1)) +
		get(vec2( 0,  1)) +
		get(vec2( 1, -1)) +
		get(vec2( 1,  0)) +
		get(vec2( 1,  1));

	if (sum == 3) {
		// ideal # of neighbors... if cell is living, stay alive, if it is dead, come to life!
		gl_FragColor = vec4( 1. );
	} else if (sum == 2) {
		// maintain current state
		float current = float( get(vec2(0, 0)) );
		gl_FragColor = vec4( vec3( current ), 1.0 );
	} else {
		// over-population or lonliness... cell dies
		gl_FragColor = vec4( vec3( 0.0 ), 1.0 );
	}
}
