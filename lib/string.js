/*requires Uint8Array*/
/*globals escape, unescape, encodeURI, decodeURIComponent*/

const chr = String.fromCharCode;

function ord(chr) {
    return chr.charCodeAt(0);
}

export function str2buffer(str, asUtf8) {
    if(asUtf8 == undefined) {
        asUtf8 = hasMultibyte(str); // || !isASCII(str)
    }
    if (asUtf8) {
        str = utf8Encode(str);
    }
    return new Uint8Array(str.split('').map(ord));
}

export function buffer2str(buf, asUtf8) {
    if(typeof buf == 'string') return buf;
    if(buf.BYTES_PER_ELEMENT > 1) {
        buf = new Uint8Array(buf.buffer);
    }
    buf = chr.apply(String, buf);
    if (!isASCII(buf)) {
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

export function toString(enc) {
    return buffer2str(this, enc && enc == 'utf8');
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
