#ifdef GL_ES
precision highp float;
#endif

attribute vec2 a_position;
uniform sampler2D simulation_texture;

void main() {
	vec2 cell = texture2D(simulation_texture, a_position).rg;
	// Vertex shaders must be from -1 to 1, but our positions are from to 0 to 1
	cell = cell * 2. - vec2(1.);

	// Render the cell at the position it told us it's at.
	gl_Position = vec4(cell, 0., 1.);
	gl_PointSize = 1.;
}
