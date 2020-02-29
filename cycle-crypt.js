// ---------------------------------------------------------------
/*requires Uint8Array, Uint32Array*/
// ---------------------------------------------------------------
import CycleCrypt from './CycleCrypt';
import { str2buffer, view8 } from './lib/string';

cycleCrypt.CycleCrypt = CycleCrypt;
cycleCrypt.randomBytes = CycleCrypt.randomBytes;
cycleCrypt.str2buffer = CycleCrypt.str2buffer;

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

    // Read salt from input
    if (salt === false) {
        data = view8(typeof data == 'string' ? str2buffer(data) : data);
        let i = data[0];
        salt = data.slice(1, ++i);
        data = data.slice(i);
    }

    const cc = new CycleCrypt(key, salt);
    data = cc._(data);

    // Add the generated salt to the output
    if (salt === true) {
        salt = cc.salt;
        let ret = new Uint8Array(1 + salt.byteLength + data.byteLength);
        ret[0] = salt.byteLength;
        ret.set(salt, 1);
        ret.set(data, 1 + ret[0]);
        ret.toString = data.toString;
        data = ret;
    }

    return data;
}
