#ifdef GL_ES
	precision mediump float;
#endif

uniform vec2 resolution;
uniform sampler2D uSampler;

void main() {
	vec2 p = gl_FragCoord.xy/resolution;
	vec3 color = texture2D(uSampler, p).rgb;
	gl_FragColor = vec4(color, 1.0);
}
