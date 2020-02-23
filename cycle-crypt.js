// ---------------------------------------------------------------
/*requires Uint8Array, Uint32Array*/
// ---------------------------------------------------------------
import randomBytes from './lib/randomBytes';
import { str2buffer, buffer2str, toString } from './lib/string';

// const INT32_MASK = -1 >>> 0;
cycleCrypt.randomBytes = randomBytes;
cycleCrypt.str2buffer = str2buffer;

// ---------------------------------------------------------------
/**
 * Simple encryption using xor, a key and salt.
 *
 * @param   string|Uint8Array  $key   The encryption key
 * @param   string|Uint8Array  $data  Data to encrypt
 * @param   string|Uint8Array|bool $salt
 *              If a string, use it as salt.
 *              If TRUE, generate salt and prepend it to the encrypted data.
 *              If FALSE, get the salt from the data.
 *
 * @return  Uint8Array  The encrypted data. If $salt is TRUE, the generated salt is prepended to the result.
 */
export default function cycleCrypt(key, data, salt = true) {
    key = str2buf(key);
    data = typeof data == 'string' ? str2buffer(data) : data;
    let dataLen = data.byteLength;

    let ret;
    if (salt === true) {
        ret = randomBytes(Math.min(256, key.byteLength * 2 + 1) + dataLen);
        ret[0] = ret.length - 1 - dataLen;
        salt = ret.slice(1, 1 + ret[0]);
    }
    else {
        if (salt === false) {
            let i = data[0];
            salt = data.slice(1, ++i);
            data = data.slice(i);
            dataLen = data.byteLength;
        }
    }
    key = cc32_salt_key(key, str2buf(salt));

    if(dataLen & 3) {
        data = str2buf(data);
    }
    else {
        data = new Uint32Array(data.buffer);
    }

    let len = key.length;
    let i = 0;
    data = data.map((b) => {
        if(i == len) i = 0;
        if(!i) cc32_mix_key(key);
        return b ^ key[i++];
    });

    data = new Uint8Array(data.buffer);

    if(data.byteLength > dataLen) {
        data = data.slice(0, dataLen);
    }

    if (ret) {
        ret.set(data, ret[0] + 1);
    }
    else {
        ret = data;
    }
    ret.toString = toString;

    return ret;
}

/**
 * Use a variation of Xorshift+ to mix the key
 *
 * @param   Uint32Array $key List of int32 values representing the key
 * @param   int   $rounds Number of rounds to process the key
 *
 * @return  array A mixed key
 */
function cc32_mix_key(key, rounds = 1) {
    let len = key.length;
    let k = len > 1 ? key[len - 1] : 0;
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
function cc32_salt_key(key, salt, rounds = 1) {
    let klen = key.length;
    let slen = salt.length;
    if (!slen) return key;

    let k = klen > 1 ? key[klen - 1] : 0;
    let s = slen > 1 ? salt[slen - 1] : 0;

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

    // Make sure the new buffer has a multiple of 4 byteLength
    let b = str.byteLength & 3;
    if(b) {
        b = str.byteLength + 4 - b;
        str = new Uint8Array(str.buffer);
        let i = new Uint8Array(b);
        i.set(str);
        str = i;
    }
    return new Uint32Array(str.buffer);
}

// Unused
// function buf2str(buf) {
//     return buffer2str(new Uint8Array(buf.buffer));
// }
