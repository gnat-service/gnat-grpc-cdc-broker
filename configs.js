const pick = require('lodash.pick');
const PATH = require('path');
const fs = require('fs');

const cache = {};

const pickFields = (opts, fields, required) => {
    const emptyFields = fields.some(field => [null, undefined].includes(opts[field]));
    if (required && emptyFields.length) {
        throw new Error(`Fields ${emptyFields} are required.`);
    }
    Object.assign(cache, pick(opts, fields));
};

const config = opts => {
    opts = Object.assign(
        {
            port: 5555,
            root: 'contracts'
        }
    );
    if (opts.root && !PATH.isAbsolute(opts.root)) {
        opts.root = PATH.join(process.cwd(), opts.root);
    }
    try {
        fs.mkdirSync(opts.root);
    } catch (e) {
        // do nothing
    }
    pickFields(opts, ['root', 'port'], true);
};

exports.config = config;

['root', 'port'].forEach(field =>
    Object.defineProperty(
        exports,
        field,
        {
            get () {
                return cache[field];
            }
        }
    )
);
