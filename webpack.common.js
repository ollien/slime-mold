module.exports = {
	entry: {
		index: ['./src/ts/index.ts'],
	},
	output: {
		filename: '[name].generated.js',
		path: `${__dirname}/static/js`,
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
			{
				test: /\.(glsl|vert|frag)$/,
				use: [
					'raw-loader',
					'glslify-loader',
				],
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		extensions: ['.wasm', '.mjs', '.js', '.ts', '.json', '.frag', '.vert'],
		alias: {
			'@shader': `${__dirname}/src/glsl/`,
		},
	},
};
