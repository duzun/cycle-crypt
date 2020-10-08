# Test the code and the algorithm

## Test the code - Unit-tests

```sh
make test_js
make test_js_cli
make test_php
make test_php_cli

make test_all
```

## Test the algorithm

Generate the [`speed.txt`](https://raw.githubusercontent.com/duzun/cycle-crypt/master/test/speed.txt) report:

```sh
make speed_report
```

### [ENV](https://www.fourmilab.ch/random/) tests

```sh
make ent_test
```

### [dieharder](http://webhome.phy.duke.edu/~rgb/General/dieharder.php) tests

Node: For these tests you have to install the `dieharder` binary first.

```sh
make dieharder_js
make dieharder_php # ~10x slower than Node.js, could run for hours or days
make dieharder_urandom # /dev/urandom - for comparison
```

### [test01](https://github.com/blep/testu01_gateway)

`@TODO`
