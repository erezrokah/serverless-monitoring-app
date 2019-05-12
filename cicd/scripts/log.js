const colors = require('colors/safe');

const error = (...args) => console.error(colors.red('Error:', ...args));
const warning = (...args) => console.warn(colors.yellow('Warning:', ...args));
const info = (...args) => console.info(colors.blue('Info:', ...args));
const log = (...args) => console.log(colors.green(...args));

module.exports = { error, warning, info, log };
