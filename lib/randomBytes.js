/*requires Uint8Array*/

import { toString } from "./string";

export default function randomBytes(size) {
    const bits = -1 >>> 0;
    const ret = new Uint8Array(size);
    let ent = Date.now();
    let len = 0;

    while (len < size) {
        if ((len & 3) == 0) {
            ent ^= Math.random() * bits;
        }
        ret[len++] = ent & 0xFF;
        ent >>>= 8;
    }

    ret.toString = toString;
    return ret;
}
