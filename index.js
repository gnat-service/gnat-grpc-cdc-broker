const app = require('./server');
const configs = require('./configs');

module.exports = {
    config: app.config,
    start (...args) {
        app.config();
        return app.listen(configs.port, ...args);
    }
};
