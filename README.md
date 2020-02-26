# cycle-crypt [![Build Status](https://travis-ci.org/duzun/cycle-crypt.svg?branch=master)](https://travis-ci.org/duzun/cycle-crypt) [![codecov](https://codecov.io/gh/duzun/cycle-crypt/branch/master/graph/badge.svg)](https://codecov.io/gh/duzun/cycle-crypt)

Variable size [symmetric](https://en.wikipedia.org/wiki/Symmetric-key_algorithm) key encryption algorithm.

PHP & JavaScript implementation, small, portable and fast.

The cipher-key is generated by cycling the input key with a variation of [XorShift+](https://en.wikipedia.org/wiki/Xorshift#xorshift+) random number generator. The bigger the key-size, the longer the period.

## Install

### PHP

```sh
composer require duzun/cycle-crypt
```

### JS

```sh
npm i -S cycle-crypt
```

### Browser

```html
<script src="https://unpkg.com/cycle-crypt"></script>
```


## Usage

Here is an example of encrypting on server and decrypting on client, salt auto-generated.

PHP:

```php
// index.php

use function duzun\cycleCrypt;

$key = '*** *** ***'; // any length
$message = 'Lorem Ipsum is simply dummy text of the printing industry...';
$ciphered = cycleCrypt($key, $message, true);

// send $ciphered to the client
echo base64_encode($ciphered);
```

Express.js:

```js
// index.js
const cycleCrypt = require('cycle-crypt');
//   or
// import cycleCrypt from 'cycle-crypt';

const key = '*** *** ***'; // any length

// ...

app.get('/', function (req, res) {
    // const salt = cycleCrypt.randomBytes(17);
    let message = 'Lorem Ipsum is simply dummy text of the printing industry...';
    let ciphered = cycleCrypt(key, message, true);

    res.send(Buffer.from(ciphered).toString('base64'));
});

```

Browser:

```js
// site.js
const key = '*** *** ***'; // must be the same key used for encrypting

let message = await fetch('/')
.then((r) => r.text())
.then(atob)
.then((ciphered) => cycleCrypt(key, ciphered, false));

console.log(message.toString('utf8')); // 'hex' | 'base64'
```

It is also possible to do the reverse: encrypt on client and decrypt on server.

You can also use your salt:

```php
// index.php

// ...

$salt = random_bytes(17); // any length
$ciphered = cycleCrypt($key, $message, $salt);

// Have to send the salt to the client too
echo json_encode([
    'salt' => base64_encode($salt),
    'ciphered' => base64_encode($ciphered)
]);
```

```js
// site.js

// fetch ciphered & salt from server and base64 decode ...
let message = cycleCrypt(key, ciphered, salt);
```

On the JS end, `message` is an instance of `Uint8Array` with a custom `.toString(encoding)`,
where `encoding` is one of  'binary', 'hex', 'base64', 'utf8' or undefined (guess).

For older browsers you should use a [DataView](https://gist.github.com/mika76/20b86c76afb77c35e0b4) polyfill.

### Encrypt in chunks

Here is an example of encrypting a big file in small chunks,
thus avoid using lots of memory.

```php
use duzun\CycleCrypt;

$cc = new CycleCrypt($key/*, $salt=true*/);
$salt = $cc->getSalt(); // required for decryption
$chunkSize = $cc->getKeyBytesSize();

$in = fopen('/path/to/file', '+r');
$out = fopen('/path/to/encrypted_file', '+w');
while(!feof($in)) {
    $chunk = fread($in, $chunkSize);
    fwrite($out, $cc($chunk));
}
fclose($in);
fclose($out);

file_put_contents('/path/to/encrypted_file.salt', $salt)
```

## Warning!

If you deal with a security critical application, please consider using one of the NIST approved standard encryption algorithms like [AES](https://en.wikipedia.org/wiki/Advanced_Encryption_Standard).

If you don't trust any encryption algorithm, here is a hint:

Choose two or more ciphers `C1`, `C2` ... `Cn` from two or more vendors.

When ciphering the message `M` with `C` = `M` ^ `C1` ^ `C2` ^ ... ^ `Cn`, the secrecy of the cipher-text `C` is not worse than the best of `Ci`.

In other words, it can't hurt the secrecy when `xor`ing more ciphers.

The theory behind this property is analysed and proven in my Masters Thesis:

The sum **c** = r<sub>1</sub>  ⊕ r<sub>2</sub> ⊕ ... ⊕ r<sub>m</sub>, where **c**, r<sub>i</sub> ∊ 𝔹<sub>k</sub> (string of bits of length k), i=1,m, is a [perfect secret](https://www.wikiwand.com/en/One-time_pad#Perfect_secrecy) if and only if there is at least one r<sub>i</sub> perfect secret and the operation ⊕ is a [cryptographic safe](https://www.wikiwand.com/en/Cryptographic_hash_function) operation.

## To Do

The JS version uses Uint32Array and Uint8Array, which use little endian or big endian, depending on hardware. The current implementation has been tested in little endian HW only!

Have to implement the alternative to big endian too.

[link](https://stackoverflow.com/questions/7869752/javascript-typed-arrays-and-endianness)
