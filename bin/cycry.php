#!/usr/bin/env php
<?php

declare(strict_types=1);

namespace duzun\CycleCrypt;

use duzun\CycleCrypt;

require __DIR__ . '/../vendor/autoload.php';

CyCry::run() !== false or die(1);

final class CyCry
{

    private static $argvAliases = [
        'k' => 'key',
        's' => 'salt',
        'so' => 'salt-out',
        'si' => 'salt-in',
        'i' => 'in',
        'o' => 'out',
        'h' => 'help',
    ];

    public static function run()
    {
        $args = self::readArgv();
        if (empty($args) || !empty($args['help'])) {
            self::usage();
            return;
        }

        try {
            $in = self::_getStream($args['in'] ?? '-', true);
            if(!$in) return false;

            $out = self::_getStream($args['out'] ?? '-', false);
            if(!$out) return false;

            if (empty($args['salt'])) {
                if(empty($args['salt-in'])) {
                    // When there in no salt, generate it and save/show it.
                    $salt = CycleCrypt::genSalt(implode('~', $args));

                    // When there is no explicit output for salt, use STDOUT or STDERR
                    if(empty($args['salt-out'])) {
                        $sout = $out === STDOUT ? STDERR : STDOUT;
                    }
                    else {
                        $sout = self::_getStream($args['salt-out'], false);
                    }
                    fwrite(
                        $sout,
                        $sout === STDOUT || $sout === STDERR
                            ? "salt: 0x" . bin2hex($salt) . PHP_EOL
                            : $salt
                    );
                }
                else {
                    $sin = self::_getStream($args['salt-in'], true);
                    if(!$sin) return false;

                    $salt = '';
                    do $salt = fread($sin, 1024); while(!feof($sin));
                }
            } else {
                $salt = $args['salt'];
                if (strncmp($salt, '0x', 2) == 0) {
                    $salt = hex2bin(substr($salt, 2));
                }
            }

            if (empty($args['key'])) {
                $key = "\0\0\0\0";
            } else {
                $key = $args['key'];
                if (strncmp($key, '0x', 2) == 0) {
                    $key = hex2bin(substr($key, 2));
                }
            }

            $cc = new CycleCrypt($key, $salt);
            $chunkSize = $cc->getKeyByteSize();

            while (!feof($in)) {
                $buf = fread($in, $chunkSize);
                $enc = $cc($buf);
                fwrite($out, $enc);
            }
        }
        finally {
            self::_closeStreams();
        }
    }

    public static function usage()
    {
        $name = basename(__FILE__, '.php');
        echo <<<EOS
Usage:
    $name -k <key> [-s <salt> | -si <salt_in> | -so <salt_out>] [-i <file_in>] [-o <file_out>]
    $name -h|--help

    -h, --help      Show this help
    -k, --key       The encryption key. Could be hex if starts with '0x'.
    -s, --salt      Random bytes to be used as salt. Could be hex if starts with '0x'.
    -si, --salt-in  Filename or - from where to read the salt.
    -so, --salt-out Filename or - where to output the generated salt.
    -i, --in        Input file to encrypt or - for STDIN
    -o, --out       Output file or - for STDOUT

    You can not combine -s, -so and -si, use just one of them.

    -i and -o default to -

EOS;
    }

    /// Read command line options
    public static function readArgv()
    {
        global $argv;
        $ret = [];
        $_a = null;
        foreach ($argv as $i => $v) {
            if ($i < 1) continue;

            if (strncmp($v, '-', 1) == 0) {
                if (isset($_a) && !isset($ret[$_a])) {
                    $ret[$_a] = true;
                }
                if (strncmp($v, '--', 2) == 0) {
                    $_a = substr($v, 2);
                } else {
                    $t = substr($v, 1);
                    $_a = self::$argvAliases[$t] ?? $t;
                }
            } else {
                $ret[$_a] = $v;
            }
        }

        if (isset($_a) && !isset($ret[$_a])) {
            $ret[$_a] = true;
        }

        return $ret;
    }

    private static $_stdIO = [
        'php://stdin' => STDIN,
        'php://stdout' => STDOUT,
        'php://stderr' => STDERR,
    ];

    private static $_openIO = [];

    private static function _getStream($fn, $in=true) {
        if($fn == '-') return $in ? STDIN : STDOUT;
        if(isset(self::$_stdIO[$fn])) return self::$_stdIO[$fn];

        $io = fopen($fn, $in ? 'r' : 'w');
        if($io) {
            self::$_openIO[] = $io;
        }

        return $io;
    }

    private static function _closeStreams() {
        $open = count(self::$_openIO);
        foreach(self::$_openIO as $io) $open -= fclose($io);
        return $open;
    }
}
