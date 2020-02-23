/*jshint esversion: 9, node: true*/

/*globals describe, it*/

const esm = require('esm')(module);
const { default: cycleCrypt } = esm('../cycle-crypt');

const { expect } = require('chai');
const crypto = require('crypto');

const test_data = require('./test-data.json');

const test_cases = [
    ["\1\0\0\0", "\0\0\0\0", "\0\0\0\0"],
    ["\0\0\0\0", "\0\0\0\0", "\1\2\3\4"],
    ["\1\0\0\0", '© dățâ to €ncryptș' + Date.now(), "\0\0\0\0"],

    ['key', '© dățâ to €ncryptș ' + Date.now(), 'salty'],
    ['test', '© dățâ to €ncryptș ' + Date.now(), true],
    ['test 窝爱你', '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ ' + Date.now(), true],

    [hash('md5', '128 bit key', true), '© dățâ to €ncryptș 窝爱你', true],
    [hash('md5', '128 bit key', true), cycleCrypt.randomBytes(123), true],
    [hash('md5', '128 bit key', true), '© dățâ to €ncryptș could be longer than the key', true],
    [hash('sha1', '160 bit key', true), ('© dățâ to €ncryptș could be longer than the key ' + Date.now()).repeat(10), true],
    [hash('sha256', '256 bit key', true), ('© dățâ to €ncryptș could be longer than the key ').repeat(11) + Date.now(), true],
    [hash('sha256', '256 bit key', true), ('© dățâ to €ncryptș could be longer than the key ').repeat(1024) + Date.now(), 'my salt is better than any salt :)' + Math.random()],
];

describe('.xorCrypt(key, data, salt=true)', () => {
    it('should encrypt and decrypt strings', () => {
        test_cases.forEach(([key, raw, salt], idx) => {
            let enc = cycleCrypt(key, raw, salt);
            expect(enc).to.not.equal(raw);
            expect(!!enc).to.be.true;

            let dec = cycleCrypt(key, enc, salt === true ? false : salt);
            expect(String(dec)).to.equal(String(raw));
        });
    });

    it('should return a buffer with .toString() method', () => {
        let key = cycleCrypt.randomBytes(12);
        let enc = cycleCrypt(key, cycleCrypt.randomBytes(103));
        let byteLength = enc.byteLength;
        expect(typeof enc.toString).to.equal('function');

        const binary = enc.toString('binary');
        const hex = enc.toString('hex');

        expect(binary.length).to.equal(byteLength);
        expect(hex.length).to.equal(byteLength * 2);

        expect(binary).to.equal(toString(enc, 'binary'));
        expect(hex).to.equal(toString(enc, 'hex'));

        // Should guess 'binary' for random/encrypted data
        expect(String(enc)).to.equal(binary);

        // btoa() is not defined in Node.js, thus can't run the following test
        // expect(enc.toString('base64').length).to.equal(Math.ceil(byteLength * 8 / 6));
        // expect(enc.toString('base64')).to.equal(toString(enc, 'base64'));

        // Can't enc.toString('utf8') on random data, cause enc is not utf8!
        // Have to improvise - the penalty of not testing toString() directly :)
        let str = 'ăâțșî©€ Тест';
        let buf = cycleCrypt.str2buffer(str);
        buf.toString = enc.toString;
        const utf8 = buf.toString('utf8');
        expect(utf8).to.equal(toString(buf, 'utf8'));
        expect(utf8).to.equal(str);

        // Should guess 'utf8'
        expect(String(buf)).to.equal(str);
    });

    it('should decrypt data encrypted in PHP', () => {
        const atob = this.atob || ((str) => Buffer.from(str, 'base64').toString('binary'));
        test_data.forEach(({key, salt, data, enc}) => {
            key = atob(key);
            salt = salt ? atob(salt) : false;
            enc = atob(enc);
            let dec = cycleCrypt(key, enc, salt);
            expect(String(dec)).to.equal(data);
        });
    });
});

function hash($algo, $data, $raw_output) {
    const _hash = crypto.createHash($algo);
    if ( $data === undefined ) return _hash;
    if ( Array.isArray($data) ) {
        $data.forEach(($d) => {
            $d != undefined && _hash.update(Buffer.isBuffer($d) ? $d : Buffer.from($d, 'utf8'));
        });
    }
    else {
        _hash.update(Buffer.isBuffer($data) ? $data : Buffer.from($data, 'utf8'));
    }
    let _enc = typeof $raw_output != 'string' ? $raw_output ? 'binary' : 'hex' : $raw_output;
    return _hash.digest(_enc);
}

function toString(buf, encoding) {
    if(encoding === false) encoding = 'binary';
    if(encoding === true) encoding = 'utf8';
    return Buffer.from(buf.buffer).toString(encoding);
}
