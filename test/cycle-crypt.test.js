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
    [hash('sha256', '256 bit key', true), ('© dățâ to €ncryptș could be longer than the key ').repeat(12) + Date.now(), 'my salt is better than any salt :)' + Math.random()],
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

    it('should decrypt data encrypted in PHP', () => {
        const atob = this.atob || ((str) => Buffer.from(str, 'base64').toString('binary'));
        let i = 1;
        test_data.forEach(({key, salt, data, enc}) => {
            if(i--<=0) return;
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
