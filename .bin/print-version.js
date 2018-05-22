const PATH = require('path');
const cwd = process.argv[process.argv.length - 1] || process.cwd();
const {version} = require(PATH.join(cwd, 'package.json'));

console.log(version);
