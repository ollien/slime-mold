#ifdef GL_ES
	precision mediump float;
#endif

uniform vec2 resolution;
uniform sampler2D tex;

/**
 * Perform a small blur effect by averaging points around the given point.
 */
vec3 get(vec2 pos) {
	vec3 color = vec3(0.);
	for (float i = -1.; i <= 1.; i++) {
		for (float j = -1.; j <= 1.; j++) {
			color += texture2D(tex, pos + vec2(i, j)/resolution).rgb;
		}
	}

	return color / 9.;
}

void main() {
	vec2 p = gl_FragCoord.xy/resolution;
	// vec3 color = get(p);

	gl_FragColor = vec4(texture2D(tex, p).rgb, 1.0);
}
