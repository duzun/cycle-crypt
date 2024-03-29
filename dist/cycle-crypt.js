(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.cycleCrypt = factory());
})(this, (function () { 'use strict';

    /**
     * Convert different types of JavaScript String to/from Uint8Array.
     *
     * @author Dumitru Uzun (DUzun.Me)
     * @version 0.2.2
     */

    /*requires Uint8Array*/
    /*globals escape, unescape, encodeURI, decodeURIComponent, btoa*/

    var chr = String.fromCharCode;
    function buffer2bin(buf) {
      buf = view8(buf);
      return chr.apply(String, buf);
    }

    /**
     * Get the hex representation of a buffer (TypedArray)
     *
     * @requires String.prototype.padStart()
     *
     * @param   {TypedArray}  buf Uint8Array is desirable, cause it is consistent regardless of the endianness
     *
     * @return  {String} The hex representation of the buf
     */
    function buffer2hex(buf) {
      var bpe = buf.BYTES_PER_ELEMENT << 1;
      return buf.reduce(function (r, c) {
        return r += (c >>> 0).toString(16).padStart(bpe, '0');
      }, '');
    }
    function buffer2str(buf, asUtf8) {
      if (typeof buf == 'string') return buf;
      buf = buffer2bin(buf);
      if (asUtf8 !== false && !isASCII(buf)) {
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
    function str2buffer(str, asUtf8) {
      str = String(str);
      if (asUtf8 == undefined) {
        // Some guessing
        asUtf8 = hasMultibyte(str); // || !isASCII(str)
      }

      if (asUtf8) {
        str = utf8Encode(str);
      }

      // Smaller x2
      // return new Uint8Array(String(str).split('').map(ord));

      // Faster x3-4
      var len = str.length;
      var buf = new Uint8Array(len);
      while (len--) {
        buf[len] = str.charCodeAt(len);
      }
      return buf;
    }

    /**
     * This method is a replacement of Buffer.toString(enc)
     * for Browser, where Buffer is not available.
     *
     * @requires btoa
     *
     * @this {Uint8Array}
     *
     * @param   {String}  enc  'binary' | 'hex' | 'base64' | 'utf8' | undefined
     *
     * @return  {String}
     */
    function toString(enc) {
      // The Node.js equivalent would be something like:
      // if(typeof Buffer == 'function') {
      //     if(enc === false) enc = 'binary';
      //     if(enc === true) enc = 'utf8';
      //     return Buffer.from(this.buffer, this.byteOffset, this.byteLength).toString(enc);
      // }
      switch (enc) {
        case false:
        case 'binary':
          return buffer2bin(this);
        case 'hex':
          return buffer2hex(this);
        case 'base64':
          return btoa(buffer2bin(this));
        case 'utf8':
          enc = true;
          break;
      }
      return buffer2str(this, enc);
    }
    function view8(buf, start, len) {
      // If buf is a Buffer, we still want to make it an Uint8Array
      if (!start && !len && buf instanceof Uint8Array && !buf.copy) return buf;
      start = start >>> 0;
      if (len == undefined) len = buf.byteLength - start;
      return new Uint8Array(buf.buffer, buf.byteOffset + start, len);
    }
    var hasMultibyteRE = /([^\x00-\xFF])/;
    var isASCIIRE = /^[\x00-\x7F]*$/;
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

    /*requires Uint8Array, Uint32Array*/
    function randomBytes(size) {
      var bits = -1 >>> 0;
      var len = size & 3;
      len = len ? size + 4 - len : size;
      var ret = new Uint8Array(len);
      var words = new Uint32Array(ret.buffer);
      var ent = Date.now();
      len >>= 2;
      while (len--) {
        words[len] = ent ^= Math.random() * bits;
      }
      if (ret.length > size) {
        ret = ret.slice(0, size);
      }
      ret.toString = toString;
      return ret;
    }

    /*requires Uint8Array, Uint32Array*/

    /**
     * Variable size symmetric key encryption algorithm.
     * The cipher-key is generated by cycling the input key with a variation of XorShift+ PRNG.
     * The bigger the key-size, the longer the period.
     *
     * @param   {String|ArrayBuffer}  key   The encryption key
     * @param   {String|ArrayBuffer|Boolean} salt
     *              If a string, use it as salt.
     *              If TRUE, generate salt.
     * @param {Number} saltRounds - Number of rounds of initial state generated from salt ⊕ key
     */
    function CycleCrypt(key, salt, saltRounds) {
      var self = this;
      key = str2buf(key);
      if (salt === true || salt === undefined) {
        salt = randomBytes(Math.min(256, key.byteLength << 1));
      }
      self.salt = salt;
      self._key = key = saltKey(key, str2buf(salt), saltRounds);
    }
    Object.defineProperties(CycleCrypt.prototype, {
      constructor: {
        value: CycleCrypt
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
          var _data = data,
            dataLength = _data.dataLength;
          if (!dataLength) return data;
          var key = this._key;
          var klen = key.length;
          var len = data.length;
          for (var i = 0, k = 0; i < len; ++i, ++k === klen && (k = 0)) {
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
        get: function get() {
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
      var len = key.length;
      var k = len > 1 ? key[len - 1] : 0;
      if (rounds == undefined) rounds = 1;
      while (rounds-- > 0) {
        for (var $i = len; $i--;) {
          var ki = $i % len;
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
      var klen = key.length;
      var slen = salt.length;
      if (!slen) return key;

      // make a copy to avoid altering the input salt
      salt = salt.slice();
      var k = klen > 1 ? key[klen - 1] : 0;
      var s = slen > 1 ? salt[slen - 1] : 0;
      if (rounds == undefined) rounds = 1;
      while (rounds-- > 0) {
        for (var i = Math.max(klen, slen); i--;) {
          var ki = i % klen;
          var si = i % slen;
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
      } else {
        str = view8(str);
      }

      // Make sure the new buffer has a multiple of 4 byteLength
      var _str = str,
        byteLength = _str.byteLength;
      var b = byteLength & 3;
      var i;
      // if(b) {
      b = byteLength + (b && 4 - b);
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

    // ---------------------------------------------------------------
    cycleCrypt.CycleCrypt = CycleCrypt;
    cycleCrypt.randomBytes = CycleCrypt.randomBytes;
    cycleCrypt.str2buffer = CycleCrypt.str2buffer;

    // ---------------------------------------------------------------
    /**
     * Simple encryption using xor, a key and salt.
     *
     * @param   {String|Uint8Array}  $key   The encryption key
     * @param   {String|Uint8Array}  $data  Data to encrypt
     * @param   {String|Uint8Array|bool} $salt
     *              If a string, use it as salt.
     *              If TRUE, generate salt and prepend it to the encrypted data.
     *              If FALSE, get the salt from the data.
     * @param {Number} saltRounds - Number of rounds of initial state generated from salt ⊕ key
     *
     *
     * @return  Uint8Array  The encrypted data. If $salt is TRUE, the generated salt is prepended to the result.
     */
    function cycleCrypt(key, data) {
      var salt = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
      var saltRounds = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1;
      // Read salt from input
      if (salt === false) {
        data = view8(typeof data == 'string' ? str2buffer(data) : data);
        var i = data[0];
        salt = data.slice(1, ++i);
        data = data.slice(i);
      } else if (salt === undefined) {
        salt = true;
      }
      var cc = new CycleCrypt(key, salt, saltRounds);
      data = cc._(data);

      // Add the generated salt to the output
      if (salt === true) {
        salt = cc.salt;
        var ret = new Uint8Array(1 + salt.byteLength + data.byteLength);
        ret[0] = salt.byteLength;
        ret.set(salt, 1);
        ret.set(data, 1 + ret[0]);
        ret.toString = data.toString;
        data = ret;
      }
      return data;
    }

    return cycleCrypt;

}));
//# sourceMappingURL=cycle-crypt.js.map
