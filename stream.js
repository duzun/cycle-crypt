/*jshint node: true*/

const { Transform } = require('stream');
const { CycleCrypt } = require('.');
// const esm = require('esm')(module);
// const { default: CycleCrypt } = esm('./CycleCrypt');

class CycleCryptStream extends Transform {
    constructor(options) {
        const key = options.key;
        const salt = options.salt;
        const saltRounds = options.saltRounds;
        let { highWaterMark } = options;
        if (highWaterMark) {
            // Make sure it is a multiple of 4 bytes
            options.highWaterMark = (((highWaterMark - 1) >> 2) + 1) << 2;
        }
        super(options);

        const cc = new CycleCrypt(key, salt == undefined ? true : salt, saltRounds);
        this._cc = cc;
        this._keyLen = cc.keyByteSize;

        // this._r = require('fs').createWriteStream('/tmp/cc.log');
    }

    _transform(chunk, encoding, callback) {
        if (encoding && encoding != 'buffer') {
            chunk = Buffer.from(chunk, encoding);
        }

        if (!chunk || !chunk.length) {
            return callback(null);
        }

        const { _cc, _keyLen } = this;
        let _buf = this._buf;

        if (_buf) {
            // this._r.write(_buf.length + ' ' + chunk.length + '\n');
            chunk = Buffer.concat([_buf, chunk]);
        }

        let rest = chunk.length % _keyLen;
        if (chunk.length - rest) {
            if (rest) {
                this._buf = chunk.slice(chunk.length - rest);
                chunk = chunk.slice(0, -rest);
            }
            else {
                this._buf = undefined;
            }

            chunk = _cc._(chunk);
            return callback(null, chunk);
        }
        else {
            this._buf = chunk;
        }

        callback(null);
    }

    _flush(callback) {
        const { _buf, _cc } = this;
        if (_buf && _buf.length) {
            callback(null, _cc._(_buf));
        }
        else {
            callback(null);
        }
    }
}

CycleCryptStream.CycleCrypt = CycleCrypt;

module.exports = CycleCryptStream;
