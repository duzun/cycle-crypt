<?php

declare(strict_types=1);

namespace duzun;

// ---------------------------------------------------------------
/**
 * Simple encryption using xor, a key and salt.
 *
 * @param   string  $key   The encryption key
 * @param   string  $data  Data to encrypt
 * @param   string|bool $salt
 *              If a string, use it as salt.
 *              If TRUE, generate salt and prepend it to the encrypted data.
 *              If FALSE, get the salt from the data.
 *
 * @return  string      The encrypted data. If $salt is TRUE, the generated salt is prepended to the result.
 */
function cycleCrypt($key, $data, $salt = true)
{
    $ret = '';

    // Generate salt and prepend it to the result
    if ($salt === true) {
        $salt = cc_gen_salt($key);
        $ret = chr(strlen($salt)) . $salt;
    }
    // Use the salt prepended to the data
    elseif ($salt === false) {
        $i = ord($data[0]);
        $salt = substr($data, 1, $i);
        $data = substr($data, $i + 1);
    }

    $key = cc32_str2buf($key);
    $key = cc32_salt_key($key, cc32_str2buf($salt));

    $len = strlen($data);
    $step = min(count($key) << 2, $len);
    for ($i = 0; $i < $len; $i += $step) {
        $key = cc32_mix_key($key);
        $ret .= cc32_buf2str($key) ^ substr($data, $i, $step);
    }

    return $ret;
}

/**
 * Use a variation of Xorshift+ to mix the key
 *
 * @param   array $key List of int32 values representing the key
 * @param   int   $rounds Number of rounds to process the key
 *
 * @return  array A mixed key
 */
function cc32_mix_key($key, $rounds = 1)
{
    $len = count($key);
    $INT32_MASK = -1 << 32 ^ -1;
    $k = $len > 1 ? end($key) : 0;
    while ($rounds-- > 0) {
        for ($i = $len; $i--;) {
            $k = $key[$ki = $i % $len] + $k;
            $k ^= $k << 13; // 19
            $k ^= ($k & $INT32_MASK) >> 17; // 15
            $k ^= $k << 5; // 27
            $key[$ki] = $k &= $INT32_MASK;
        }
    }

    return $key;
}

/**
 * Use a variation of Xorshift+ to salt the key
 *
 * @param   array $key
 * @param   array $salt
 * @param   int   $rounds Number of rounds to mix the key
 *
 * @return  array A mixed key
 */
function cc32_salt_key($key, $salt, $count = 1)
{
    $klen = count($key);
    $slen = count($salt);
    if (!$slen) return $key;

    $INT32_MASK = -1 << 32 ^ -1;
    $k = $klen > 1 ? end($key) : 0;
    $s = $slen > 1 ? end($salt) : 0;
    while ($count-- > 0) {
        for ($i = max($klen, $slen); $i--;) {
            $k = $key[$ki = $i % $klen] + $k;
            $s = $salt[$si = $i % $slen] + $s;

            $s ^= $s << 13; // 19
            $s ^= ($s & $INT32_MASK) >> 7; // 25

            $k ^= $k << 11; // 21
            $k ^= ($k & $INT32_MASK) >> 8; // 24

            $k += $s;

            $key[$ki] =$k &= $INT32_MASK;
            $salt[$si] =$s &= $INT32_MASK;
        }
    }

    return $key;
}

function cc_gen_salt($seed)
{
    return hash('sha1', dechex(mt_rand()) . $seed . microtime(), true);
}

/**
 * Pad a string on the right to the length of a multiple of 4
 *
 * @param   string  $str
 * @return  string
 */
function cc32_str_pad_right($str, $chr = "\x0")
{
    $b = strlen($str) & 3 and
        $str .= str_repeat($chr[0], 4 - $b);
    return $str;
}

function cc32_str2buf($str)
{
    if (is_array($str)) return $str;
    $str = cc32_str_pad_right($str);
    return array_values(unpack('V' . (strlen($str) >> 2), $str));
}

function cc32_buf2str($buf)
{
    // return pack('V*', ...$buf); // PHP 5.6+
    array_unshift($buf, 'V*');
    return call_user_func_array('pack', $buf);
}
