#ifdef GL_ES
	precision mediump float;
#endif

#define FEEDBACK_AMOUNT 0.9

uniform vec2 resolution;
uniform sampler2D cell_texture;
uniform sampler2D feedback_texture;

void main() {
	vec2 p = gl_FragCoord.xy / resolution;
	vec3 cell = texture2D(cell_texture, p).rgb;
	vec3 old_deposit = texture2D(feedback_texture, p).rgb;

	gl_FragColor = vec4(cell + FEEDBACK_AMOUNT * old_deposit, 1.);
}
