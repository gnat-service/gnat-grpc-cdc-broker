const app = require('./server');
const configs = require('./configs');

module.exports = {
    config: app.config,
    start (...args) {
        return app.listen(configs.port, ...args);
    }
};
