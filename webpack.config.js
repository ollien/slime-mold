module.exports = {
	entry: {
		index: ['./src/ts/index.ts'],
	},
	devtool: 'eval-source-map',
	output: {
		filename: '[name].generated.js',
		path: `${__dirname}/static/js`,
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				use: 'ts-loader',
			},
			{
				test: /\.(glsl|vert|frag)$/,
				use: [
					'raw-loader',
					'glslify-loader',
				],
			},
		],
	},
	resolve: {
		extensions: ['.wasm', '.mjs', '.js', '.ts', '.json', '.frag', '.vert'],
		alias: {
			'@shader': `${__dirname}/src/glsl/`,
		},
	},
}
