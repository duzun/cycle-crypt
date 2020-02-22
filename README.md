# cycle-crypt [![Build Status](https://travis-ci.org/duzun/cycle-crypt.svg?branch=master)](https://travis-ci.org/duzun/cycle-crypt) [![codecov](https://codecov.io/gh/duzun/cycle-crypt/branch/master/graph/badge.svg)](https://codecov.io/gh/duzun/cycle-crypt)

Variable key-size encryption algorithm.

PHP & JavaScript implementation, small, portable and fast.

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

// fetch ciphered & salt from server ...
let message = cycleCrypt(key, ciphered, salt);
```

On the JS end, `message` is an instance of `Uint8Array` with a custom `.toString(encoding)`,
where `encoding` is one of  'binary', 'hex', 'base64', 'utf8' or undefined (guess).

For older browsers you should use a [DataView](https://gist.github.com/mika76/20b86c76afb77c35e0b4) polyfill.
