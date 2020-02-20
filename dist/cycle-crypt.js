(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = global || self, global.cycleCrypt = factory());
}(this, (function () { 'use strict';

    /*requires Uint8Array*/

    /*globals escape, unescape, encodeURI, decodeURIComponent*/
    var chr = String.fromCharCode;

    function ord(chr) {
      return chr.charCodeAt(0);
    }

    function str2buffer(str, asUtf8) {
      if (asUtf8 == undefined) {
        asUtf8 = hasMultibyte(str); // || !isASCII(str)
      }

      if (asUtf8) {
        str = utf8Encode(str);
      }

      return new Uint8Array(str.split('').map(ord));
    }
    function buffer2str(buf, asUtf8) {
      if (typeof buf == 'string') return buf;

      if (buf.BYTES_PER_ELEMENT > 1) {
        buf = new Uint8Array(buf.buffer);
      }

      buf = chr.apply(String, buf);

      if (!isASCII(buf)) {
        if (asUtf8) {
          buf = utf8Decode(buf);
        } else if (asUtf8 == undefined) {
          try {
            buf = utf8Decode(buf);
          } catch (err) {}
        }
      }

      return buf;
    }
    function toString(enc) {
      return buffer2str(this, enc && enc == 'utf8');
    }
    var hasMultibyteRE = /([^\x00-\xFF]+)/;
    var isASCIIRE = /^[\x00-\x7F]+$/;
    function hasMultibyte(str) {
      var m = hasMultibyteRE.exec(str);
      return m ? m[1] : false;
    }
    function isASCII(str) {
      return isASCIIRE.test(str);
    }
    function utf8Encode(str) {
      return unescape(encodeURI(str));
    }
    function utf8Decode(str) {
      return decodeURIComponent(escape(str));
    }

    /*requires Uint8Array*/
    function randomBytes(size) {
      var bits = -1 >>> 0;
      var ret = new Uint8Array(size);
      var ent = Date.now();
      var len = 0;

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

    // ---------------------------------------------------------------

    cycleCrypt.randomBytes = randomBytes; // ---------------------------------------------------------------

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

    function cycleCrypt(key, data) {
      var salt = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
      key = str2buf(key);
      data = typeof data == 'string' ? str2buffer(data) : data;
      var dataLen = data.byteLength;
      var ret;

      if (salt === true) {
        ret = randomBytes(Math.min(256, key.byteLength * 2 + 1) + dataLen);
        ret[0] = ret.length - 1 - dataLen;
        salt = ret.slice(1, 1 + ret[0]);
      } else {
        if (salt === false) {
          var _i = data[0];
          salt = data.slice(1, ++_i);
          data = data.slice(_i);
          dataLen = data.byteLength;
        }
      }

      key = cc32_salt_key(key, str2buf(salt));

      if (dataLen & 3) {
        data = str2buf(data);
      } else {
        data = new Int32Array(data.buffer);
      }

      var len = key.length;
      var i = 0;
      data = data.map(function (b) {
        if (i == len) i = 0;
        if (!i) cc32_mix_key(key);
        return b ^ key[i++];
      });
      data = new Uint8Array(data.buffer);

      if (data.byteLength > dataLen) {
        data = data.slice(0, dataLen);
      }

      if (ret) {
        ret.set(data, ret[0] + 1);
      } else {
        ret = data;
      }

      ret.toString = toString;
      return ret;
    }
    /**
     * Use a variation of Xorshift+ to mix the key
     *
     * @param   Int32Array $key List of int32 values representing the key
     * @param   int   $rounds Number of rounds to process the key
     *
     * @return  array A mixed key
     */

    function cc32_mix_key(key) {
      var rounds = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
      var len = key.length;
      var k = len > 1 ? key[len - 1] : 0;

      while (rounds-- > 0) {
        for (var $i = len; $i--;) {
          var ki = $i % len;
          k = key[ki] + k;
          k ^= k << 13; // 19

          k ^= k >> 17; // 15

          k ^= k << 5; // 27
          // k &= INT32_MASK;

          key[ki] = k;
        }
      }

      return key;
    }
    /**
     * Use a variation of Xorshift+ to salt the key
     *
     * @param   Int32Array $key
     * @param   Int32Array $salt
     * @param   int   $rounds Number of rounds to mix the key
     *
     * @return  array A mixed key
     */


    function cc32_salt_key(key, salt) {
      var rounds = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;
      var klen = key.length;
      var slen = salt.length;
      if (!slen) return key;
      var k = klen > 1 ? key[klen - 1] : 0;
      var s = slen > 1 ? salt[slen - 1] : 0;

      while (rounds-- > 0) {
        for (var i = Math.max(klen, slen); i--;) {
          var ki = i % klen;
          var si = i % slen;
          k = key[ki] + k;
          s = salt[si] + s;
          s ^= s << 13; // 19

          s ^= s >> 7; // 25

          k ^= k << 11; // 21

          k ^= k >> 8; // 24

          k += s; // k &= INT32_MASK;
          // s &= INT32_MASK;

          key[ki] = k;
          salt[si] = s;
        }
      }

      return key;
    }

    function str2buf(str) {
      if (!str || typeof str.byteLength != 'number') {
        str = str2buffer(str);
      } // Make sure the new buffer has a multiple of 4 byteLength


      var b = str.byteLength & 3;

      if (b) {
        b = str.byteLength + 4 - b;
        str = new Uint8Array(str.buffer);
        var i = new Uint8Array(b);
        i.set(str);
        str = i;
      }

      return new Int32Array(str.buffer);
    }

    return cycleCrypt;

})));
//# sourceMappingURL=cycle-crypt.js.map
