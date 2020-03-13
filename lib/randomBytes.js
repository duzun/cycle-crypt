/*requires Uint8Array, Uint32Array*/

import { toString } from 'string-encode';

export default function randomBytes(size) {
    const bits = -1 >>> 0;

    let len = size & 3;
    len = len ? size + 4 - len : size;
    let ret = new Uint8Array(len);
    const words = new Uint32Array(ret.buffer);
    let ent = Date.now();

    len >>= 2;
    while (len--) {
        words[len] =
        ent ^= Math.random() * bits;
    }

    if(ret.length > size) {
        ret = ret.slice(0, size);
    }

    ret.toString = toString;
    return ret;
}
