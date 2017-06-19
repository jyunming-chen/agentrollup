
// Doc: https://github.com/rollup/rollup/wiki/JavaScript-API#format
export default { 
    entry: './src/main.js', 
    dest: './build/js/bundle.js', 
    format: 'umd',
	moduleName: 'AG',
    sourceMap: 'inline',
    plugins: []
};

