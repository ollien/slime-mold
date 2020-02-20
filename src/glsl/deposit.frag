#ifdef GL_ES
	precision mediump float;
#endif

#define FEEDBACK_AMOUNT 0.995

uniform vec2 resolution;
uniform sampler2D cell_texture;
uniform sampler2D feedback_texture;

/**
 * Perform a small blur effect by averaging points around the given point.
 */
vec3 get(vec2 pos) {
	vec3 color = vec3(0.);
	for (float i = -1.; i <= 1.; i++) {
		for (float j = -1.; j <= 1.; j++) {
			color += texture2D(cell_texture, pos + vec2(i, j)/resolution).rgb;
		}
	}

	return color / 9.;
}


void main() {
	vec2 p = gl_FragCoord.xy / resolution;
	vec3 cell = get(p);
	vec3 old_deposit = texture2D(feedback_texture, p).rgb;

	gl_FragColor = vec4(cell + FEEDBACK_AMOUNT * old_deposit, 1.);
}
