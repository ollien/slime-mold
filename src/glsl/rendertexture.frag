#ifdef GL_ES
	precision mediump float;
#endif

uniform vec2 resolution;
uniform sampler2D tex;

void main() {
	vec2 p = gl_FragCoord.xy/resolution;

	gl_FragColor = vec4(texture2D(tex, p).rgb, 1.0);
}
