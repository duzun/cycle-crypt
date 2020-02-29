/*requires Uint8Array*/
/*globals escape, unescape, encodeURI, decodeURIComponent, btoa*/

const chr = String.fromCharCode;

function ord(chr) {
    return chr.charCodeAt(0);
}

export function buffer2bin(buf) {
    buf = view8(buf);
    return chr.apply(String, buf);
}

export function buffer2hex(buf) {
    const bpe = buf.BYTES_PER_ELEMENT << 1;
    return buf.reduce((r, c) => r += (c >>> 0).toString(16).padStart(bpe,'0'), '');
}

export function buffer2str(buf, asUtf8) {
    if(typeof buf == 'string') return buf;
    buf = buffer2bin(buf);
    if (asUtf8 !== false && !isASCII(buf)) {
        if(asUtf8) {
            buf = utf8Decode(buf);
        } else if(asUtf8 == undefined) {
            try {
                buf = utf8Decode(buf);
            } catch(err) {}
        }
    }
    return buf;
}

export function str2buffer(str, asUtf8) {
    if(asUtf8 == undefined) {
        // Some guessing
        asUtf8 = hasMultibyte(str); // || !isASCII(str)
    }
    if (asUtf8) {
        str = utf8Encode(str);
    }
    return new Uint8Array(str.split('').map(ord));
}

/**
 * This method is a replacement of Buffer.toString(enc)
 * for Browser, where Buffer is not available.
 *
 * @param   {String}  enc  'binary' | 'hex' | 'base64' | 'utf8' | undefined
 *
 * @return  {String}
 */
export function toString(enc) {
    // The Node.js equivalent would be something like:
    // if(typeof Buffer == 'function') {
    //     if(enc === false) enc = 'binary';
    //     if(enc === true) enc = 'utf8';
    //     return Buffer.from(this.buffer, this.byteOffset, this.byteLength).toString(enc);
    // }
    switch(enc) {
        case false:
        case 'binary': return buffer2bin(this);
        case 'hex': return buffer2hex(this);
        case 'base64': return btoa(buffer2bin(this));
        case 'utf8': enc = true; break;
    }
    return buffer2str(this, enc);
}

export function view8(buf, start, len) {
    // If buf is a Buffer, we still want to make it an Uint8Array
    if(!start && !len && buf instanceof Uint8Array && !buf.copy) return buf;
    start = start >>> 0;
    if(len == undefined) len = buf.byteLength - start;
    return new Uint8Array(buf.buffer, buf.byteOffset+start, len);
}

const hasMultibyteRE = /([^\x00-\xFF]+)/;
const isASCIIRE = /^[\x00-\x7F]+$/;

export function hasMultibyte(str) {
    let m = hasMultibyteRE.exec(str);
    return m ? m[1] : false;
}

export function isASCII(str) {
    return isASCIIRE.test(str);
}

export function utf8Encode(str) {
    return unescape(encodeURI(str));
}

export function utf8Decode(str) {
    return decodeURIComponent(escape(str));
}
