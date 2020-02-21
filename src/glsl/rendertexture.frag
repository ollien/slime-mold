#ifdef GL_ES
	precision mediump float;
#endif

uniform vec2 resolution;
uniform vec3 color;
uniform sampler2D luma_texture;

void main() {
	vec2 p = gl_FragCoord.xy/resolution;

	gl_FragColor = vec4(color/255. * texture2D(luma_texture, p).rgb, 1.0);
}
