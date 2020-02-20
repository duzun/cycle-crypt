<?php
declare(strict_types=1);

namespace duzun;
use function duzun\cycleCrypt;
use PHPUnit\Framework\TestCase;

// When run with ../vendor/bin/phpunit the duzun\cycleCrypt is autoloaded,
// but when run with phpunit (eg. on travis-ci). we have to require the PHP file.
function_exists('duzun\\cycleCrypt') or
require __DIR__ . '/../cycle-crypt.php';

class TestValuesHelpers extends TestCase {

    public function test_cycleCrypt() {
        $test_data = [];

        foreach([
            ["\1\0\0\0", "\0\0\0\0", "\0\0\0\0"],
            ["\0\0\0\0", "\0\0\0\0", "\1\2\3\4"],
            ["\1\0\0\0", '© dățâ to €ncryptș' . microtime(), "\0\0\0\0"],

            ['key', '© dățâ to €ncryptș' . microtime(), 'salty'],
            ['test', '© dățâ to €ncryptș' . microtime(), true],
            ['test 窝爱你', '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' . microtime(), true],

            [hash('md5', '128 bit key', true), '© dățâ to €ncryptș 窝爱你', true],
            [hash('md5', '128 bit key', true), '© dățâ to €ncryptș could be longer than the key', true],
            [hash('sha1', '160 bit key', true), str_repeat('© dățâ to €ncryptș could be longer than the key '. microtime(), 10), true],
            [hash('sha256', '256 bit key', true), str_repeat('© dățâ to €ncryptș could be longer than the key ', 11) . microtime(), true],
            [hash('sha256', '256 bit key', true), str_repeat('© dățâ to €ncryptș could be longer than the key ', 12) . microtime(), 'my salt is better than any salt :)' . mt_rand()],
        ] as $set) {
            $key = $set[0];
            $salt = $set[2];
            $raw = $set[1];
            $enc = cycleCrypt($key, $raw, $salt);
            $this->assertNotEquals($raw, $enc);
            $this->assertNotEmpty($enc);

            $dec = cycleCrypt($key, $enc, $salt === true ? false : $salt);
            $this->assertEquals($raw, $dec);

            // Prepare data for JS
            $out = [
                'key' => rtrim(base64_encode($key), '='),
                'salt' => $salt !== true ? rtrim(base64_encode($salt), '=') : null,
                'data' => $raw,
                'enc'  => rtrim(base64_encode($enc), '='),
            ];
            if(empty($out['salt'])) {
                unset($out['salt']);
            }
            $test_data[] = $out;
        }

        $out = json_encode($test_data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
        file_put_contents(__DIR__ . '/test-data.json', $out);
    }

}
