#ifdef GL_ES
	precision mediump float;
#endif

#define FEEDBACK_AMOUNT 0.925
#define BLUR_RADIUS 5.

uniform vec2 resolution;
uniform sampler2D cell_texture;
uniform sampler2D feedback_texture;

/**
 * Perform a small blur effect by averaging points around the given point.
 */
vec3 get_with_diffuse(sampler2D texture, vec2 pos) {
	vec3 color = vec3(0.);
	for (float i = -BLUR_RADIUS; i <= BLUR_RADIUS; i++) {
		for (float j = -BLUR_RADIUS; j <= BLUR_RADIUS; j++) {
			color += texture2D(texture, pos + vec2(i, j)/resolution).rgb;
		}
	}

	return color / pow(BLUR_RADIUS * 2. + 1., 2.);
}


void main() {
	vec2 p = gl_FragCoord.xy / resolution;
	vec3 cell = texture2D(cell_texture, p).rgb;
	vec3 old_deposit = get_with_diffuse(feedback_texture, p).rgb;

	gl_FragColor = vec4(cell + FEEDBACK_AMOUNT * old_deposit, 1.);
}
