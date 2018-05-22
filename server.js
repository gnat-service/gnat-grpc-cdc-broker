const express = require('express');
const bodyParser = require('body-parser');
const PATH = require('path');
const fs = require('fs');
const isEmpty = require('lodash.isempty');
const configs = require('./configs');

const app = express();
const contractRouter = express.Router();
const router = express.Router();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

const promisify = (ctx, name) =>
    function (...args) {
        return new Promise((resolve, reject) =>
            ctx[name](...args, (err, ret) => err ? reject(err) : resolve(ret))
        );
    };

const writeFileAsync = promisify(fs, 'writeFile');
const unlinkAsync = promisify(fs, 'unlink');
const readFileAsync = promisify(fs, 'readFile');

const getFilename = paths => PATH.join(configs.root, `${[...paths].join('-')}.json`);

const postHandler = async (paths, body) => {
    if (isEmpty(body)) {
        throw new Error(`Expect \`body\` not to be empty.`);
    }
    let text;
    if (typeof body === 'string') {
        text = body;
    } else {
        text = JSON.stringify(body);
    }
    await writeFileAsync(getFilename(paths), text);
};

const delHandler = async (paths) => unlinkAsync(getFilename(paths));

const handler = cb =>
    async (req, res, ...args) => {
        try {
            const result = await cb(req, res, ...args);
            res.send({ok: true, data: result});
        } catch (err) {
            res.send({ok: false, message: err.message, stack: err.stack}).end();
        }
        res.end();
    };

contractRouter.post('/:provider/:consumer', handler(async req => {
    const {params, body} = req;
    const {provider, consumer} = params;
    await postHandler([provider, consumer], body);
}));

contractRouter.post('/:provider/:consumer/:tag', handler(async req => {
    const {params, body} = req;
    const {provider, consumer, tag} = params;
    await postHandler([provider, consumer, tag], body);
}));

contractRouter.get('/:provider/:consumer', handler(async (req, res) => {
    const {provider, consumer} = req.params;
    const filename = getFilename([provider, consumer]);
    const json = await readFileAsync(filename);
    res.setHeader('Content-Type', 'application/json');
    return json ? JSON.parse(json) : {};
}));

contractRouter.get('/:provider/:consumer/:tag', handler(async (req, res) => {
    const {provider, consumer, tag} = req.params;
    const filename = getFilename([provider, consumer, tag]);
    const json = await readFileAsync(filename);
    res.setHeader('Content-Type', 'application/json');
    return json ? JSON.parse(json) : {};
}));

contractRouter.delete('/:provider/:consumer', handler(async (req) => {
    const {provider, consumer} = req.params;
    await delHandler([provider, consumer]);
    return {};
}));

contractRouter.delete('/:provider/:consumer/:tag', handler(async (req) => {
    const {provider, consumer, tag} = req.params;
    await delHandler([provider, consumer, tag]);
    return {};
}));

router.use('/contract', contractRouter);
app.use(router);

app._getFilename = getFilename;
app._writeFileAsync = writeFileAsync;
app._readFileAsync = readFileAsync;

app.config = configs.config;
module.exports = app;
