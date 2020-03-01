/*requires Uint8Array, Uint32Array*/

import randomBytes from './lib/randomBytes';
import { str2buffer, view8, toString } from './lib/string';

/**
 * Variable size symmetric key encryption algorithm.
 * The cipher-key is generated by cycling the input key with a variation of XorShift+ PRNG.
 * The bigger the key-size, the longer the period.
 *
 * @param   {String|ArrayBuffer}  key   The encryption key
 * @param   {String|ArrayBuffer|Boolean} salt
 *              If a string, use it as salt.
 *              If TRUE, generate salt.
 */
export default function CycleCrypt(key, salt) {
    const self = this;

    key = str2buf(key);
    if (salt === true || salt === undefined) {
        salt = randomBytes(Math.min(256, key.byteLength << 1));
    }
    self.salt = salt;
    self._key = key = saltKey(key, str2buf(salt));
}

Object.defineProperties(CycleCrypt.prototype, {
    constructor: {
        value: CycleCrypt,
    },

    /**
     * Encrypt/decrypt the data and advance the internal state of the cipher-key.
     *
     * @param   {String|ArrayBuffer}  data  Data to encrypt
     *
     * @return  Uint8Array The encrypted/decrypted data
     */
    _: {
        value: function _(data) {
            data = str2buf(data);
            const { dataLength } = data;
            if (!dataLength) return data;

            const key = this._key;
            let klen = key.length;
            let len = data.length;
            for (let i = 0, k = 0; i < len; ++i, ++k === klen && (k = 0)) {
                if (!k) mixKey(key);
                data[i] ^= key[k];
            }

            data = view8(data, 0, dataLength);
            data.toString = toString;
            return data;
        }
    },

    /**
     * Get the number of bytes in the key
     *
     * @return  int
     */
    keyByteSize: {
        get() {
            return this._key.byteLength;
        }
    }
});

// Static methods:
CycleCrypt.randomBytes = randomBytes; // Uint8Array
CycleCrypt.toString = toString;
CycleCrypt.str2buffer = str2buffer; // Uint8Array
CycleCrypt.str2buf = str2buf; // Uint32Array
// // CycleCrypt.buf2str = buf2str;

/**
 * Use a variation of Xorshift+ to mix the key
 *
 * @param   Uint32Array $key List of int32 values representing the key
 * @param   int   $rounds Number of rounds to process the key
 *
 * @return  array A mixed key
 */
function mixKey(key, rounds) {
    let len = key.length;
    let k = len > 1 ? key[len - 1] : 0;

    if (rounds == undefined) rounds = 1;
    while (rounds-- > 0) {
        for (let $i = len; $i--;) {
            let ki = $i % len;
            k = key[ki] + k;
            k ^= k << 13; // 19
            k ^= k >>> 17; // 15
            k ^= k << 5; // 27
            // k >>>= 0;
            key[ki] = k;
        }
    }

    return key;
}

/**
 * Use a variation of Xorshift+ to salt the key
 *
 * @param   Uint32Array $key
 * @param   Uint32Array $salt
 * @param   int   $rounds Number of rounds to mix the key
 *
 * @return  array A mixed key
 */
function saltKey(key, salt, rounds) {
    let klen = key.length;
    let slen = salt.length;
    if (!slen) return key;

    // make a copy to avoid altering the input salt
    salt = salt.slice();

    let k = klen > 1 ? key[klen - 1] : 0;
    let s = slen > 1 ? salt[slen - 1] : 0;

    if (rounds == undefined) rounds = 1;
    while (rounds-- > 0) {
        for (let i = Math.max(klen, slen); i--;) {
            let ki = i % klen;
            let si = i % slen;
            k = key[ki] + k;
            s = salt[si] + s;

            s ^= s << 13; // 19
            s ^= s >>> 7; // 25

            k ^= k << 11; // 21
            k ^= k >>> 8; // 24

            // s >>>= 0;
            k += s;
            // k >>>= 0;

            key[ki] = k;
            salt[si] = s;
        }
    }

    return key;
}

function str2buf(str) {
    if (!str || typeof str.byteLength != 'number') {
        str = str2buffer(str);
    }
    else {
        str = view8(str);
    }

    // Make sure the new buffer has a multiple of 4 byteLength
    const { byteLength } = str;
    let b = byteLength & 3;
    let i;
    // if(b) {
        b = byteLength + (b && (4 - b));
        i = new Uint8Array(b);
        i.set(str);
    // }
    // else {
    //     b = byteLength;
    //     i = str.slice();
    // }

    str = new Uint32Array(i.buffer, i.byteOffset, b >> 2);
    str.dataLength = byteLength;

    return str;
}

// Unused
// function buf2str(buf) {
//     return buffer2str(view8(buf));
// }
