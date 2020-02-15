#ifdef GL_ES
	precision mediump float;
#endif

uniform mediump float time;
uniform mediump vec2 resolution;

void main() {
	gl_FragColor = vec4(
		gl_FragCoord.x / resolution.x,
		gl_FragCoord.y / resolution.y,
		mod(time/100.,1.),
		1.0
	);
}
