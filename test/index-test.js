const {assert} = require('chai');
const request = require('supertest');
const app = require('../server');
const fs = require('fs');
const PATH = require('path');

const root = PATH.join(__dirname, './public');
try {
    fs.mkdirSync(root);
} catch (e) {
    // do nothing
}
app.config({root});

const req = ({method = 'get', url, query, body, headers}) => {
    const r = request(app)[method](url);
    query && r.query(query);
    body && r.send(body);
    if (headers) {
        Object.keys(headers).forEach(key => r.set(key, headers[key]));
    }
    return new Promise((resolve, reject) =>
        r.end((err, res) => (err || res.error) ? reject(err || res.error) : resolve(res))
    );
};

const get = opts => req(Object.assign({method: 'get'}, opts));
const post = opts => req(Object.assign({method: 'post'}, opts));
const del = opts => req(Object.assign({method: 'delete'}, opts));

describe('/contract', () => {
    const getFileData = (...paths) => app._readFileAsync(app._getFilename(paths));
    const createFile = (paths, data) => app._writeFileAsync(app._getFilename(paths), data);

    const obj = {key: 'val'};
    let json;
    beforeEach(() => {
        json = JSON.stringify(obj);
    });
    after(() => fs.rmdirSync(root));

    describe('POST /:provider/:consumer', async () => {
        const URL = '/contract/p/c';
        const paths = ['p', 'c'];
        const writeJson = json => post({url: URL, headers: {'Content-Type': 'application/json'}, body: json});

        afterEach(() => fs.unlinkSync(app._getFilename(paths)));
        it('should write data to a json file', async () => {
            const r = await writeJson(json);
            assert.notProperty(r.body, 'ok');
            const actual = await getFileData(...paths);
            assert.equal(json, actual);
        });

        context('when the assigned contract file exists', () => {
            beforeEach(async () => writeJson(json));

            it('should overwrite the exists file', async () => {
                assert.equal((await getFileData('p', 'c')).toString(), json)
                const expectation = {key: '1'};
                const r = await writeJson(expectation);
                assert.notProperty(r.body, 'ok');
                const actual = (await getFileData('p', 'c')).toString();
                assert.deepEqual(actual, JSON.stringify(expectation));
            });
        });
    });

    describe('POST /:provider/:consumer/:tag', async () => {
        const URL = '/contract/p/c/t';
        const writeJson = json => post({url: URL, headers: {'Content-Type': 'application/json'}, body: json});

        afterEach(() => fs.unlinkSync(app._getFilename(['p', 'c', 't'])));
        it('should write data to a json file', async () => {
            const r = await writeJson(json);
            assert.notProperty(r.body, 'ok');
            const actual = await getFileData('p', 'c', 't');
            assert.equal(json, actual);
        });

        context('when the assigned contract file exists', () => {
            beforeEach(async () => writeJson(json));

            it('should overwrite the exists file', async () => {
                assert.equal((await getFileData('p', 'c', 't')).toString(), json)
                const expectation = {key: '1'};
                const r = await writeJson(expectation);
                assert.notProperty(r.body, 'ok');
                const actual = (await getFileData('p', 'c', 't')).toString();
                assert.deepEqual(actual, JSON.stringify(expectation));
            });
        });
    });

    describe('GET /:provider/:consumer', () => {
        const URL = '/contract/p/c';
        const getJson = () => get({url: URL});

        beforeEach(async () => {
            app._writeFileAsync(app._getFilename(['p', 'c']), json);
        });
        afterEach(() => fs.unlinkSync(app._getFilename(['p', 'c'])));

        it('should get json response', async () => {
            const {body} = await getJson();
            assert.deepEqual(body, obj);
        });
    });
    describe('GET /:provider/:consumer/:tag', () => {
        const URL = '/contract/p/c/t';
        const getJson = () => get({url: URL});

        beforeEach(() => {
            json = JSON.stringify(obj);
        });
        beforeEach(async () => {
            app._writeFileAsync(app._getFilename(['p', 'c', 't']), json);
        });
        afterEach(() => fs.unlinkSync(app._getFilename(['p', 'c', 't'])));

        it('should get json response', async () => {
            const {body} = await getJson();
            assert.deepEqual(body, obj);
        });
    });

    describe('DELETE /:provider/:consumer', () => {
        const URL = '/contract/p/c';
        const paths = ['p', 'c'];
        beforeEach(() => createFile(paths, '{}'));
        const path = app._getFilename(paths);

        it('should delete file by url', async () => {
            assert.equal(fs.existsSync(path), true);
            await del({url: URL});
            assert.equal(fs.existsSync(path), false);
        });
    });

    describe('DELETE /:provider/:consumer/:tag', () => {
        const URL = '/contract/p/c/t';
        const paths = ['p', 'c', 't'];
        beforeEach(() => createFile(paths, '{}'));
        const path = app._getFilename(paths);

        it('should delete file by url', async () => {
            assert.equal(fs.existsSync(path), true);
            await del({url: URL});
            assert.equal(fs.existsSync(path), false);
        });
    });
});
