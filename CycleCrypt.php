<?php

declare(strict_types=1);

namespace duzun;

/**
 * Variable size symmetric key encryption algorithm.
 * The cipher-key is generated by cycling the input key with a variation of XorShift+ PRNG.
 * The bigger the key-size, the longer the period.
 */
class CycleCrypt
{
    private $pos = 0;
    private $key;
    private $salt;

    /**
     * @param   string  $key   The encryption key
     * @param   string|bool $salt
     *              If a string, use it as salt.
     *              If TRUE, generate salt.
     */
    public function __construct($key, $salt = true)
    {
        if ($salt === true) {
            $salt = static::genSalt($key);
        }
        $this->salt = $salt;

        $key = static::str2buf($key);
        $this->key = static::saltKey($key, static::str2buf($salt));
    }

    /**
     * Encrypt/decrypt the data and advance the internal state of the cipher-key.
     *
     * @param   string  $data  Data to encrypt
     *
     * @return  string The encrypted/decrypted data
     */
    public function __invoke($data)
    {
        $len = strlen($data);
        if (!$len) return '';

        $key = $this->key;
        $pos = $this->pos;
        $kcount = count($key);
        $klen = $kcount << 2;
        $i = 0;

        // If there is a piece of the key unused in the last iteration,
        // use it now!
        // If the data comes in chunks of the size of the key,
        // we never get to this case.
        if ($pos) {
            $p = $pos & 3;
            $k = array_slice($key, $pos >> 2, (($len + $p - 1) >> 2) + 1);
            $k = static::buf2str($k);
            if ($p) {
                $k = substr($k, $p);
            }
            $ret = $k ^ $data;

            $i = strlen($ret);
            if ($i >= $len) {
                $this->pos = ($pos + $i) % $klen;
                return $ret;
            }
        } else {
            $ret = '';
        }

        $step = $len - $i;
        $this->pos = $step % $klen;
        if ($step < $klen) {
            $kstep = (($step - 1) >> 2) + 1;
        } else {
            $kstep = $kcount;
            $step = $klen;
        }

        while ($i < $len) {
            $key = static::mixKey($key);
            $k = static::buf2str($kstep < $kcount ? array_slice($key, 0, $kstep) : $key);
            $ret .= $k ^ substr($data, $i, $step);
            $i += $step;
        }
        $this->key = $key;

        return $ret;
    }

    /**
     * Get the used/generated salt.
     *
     * @return  string
     */
    public function getSalt()
    {
        return $this->salt;
    }

    /**
     * Get the number of bytes in the key
     *
     * @return  int
     */
    public function getKeyByteSize() {
        return count($this->key) << 2;
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
    public static function saltKey($key, $salt, $rounds = 1)
    {
        $klen = count($key);
        $slen = count($salt);
        if (!$slen) return $key;

        $INT32_MASK = -1 << 32 ^ -1;
        $k = $klen > 1 ? end($key) : 0;
        $s = $slen > 1 ? end($salt) : 0;
        while ($rounds-- > 0) {
            for ($i = max($klen, $slen); $i--;) {
                $k = $key[$ki = $i % $klen] + $k;
                $s = $salt[$si = $i % $slen] + $s;

                $s ^= $s << 13; // 19
                $s ^= ($s & $INT32_MASK) >> 7; // 25

                $k ^= $k << 11; // 21
                $k ^= ($k & $INT32_MASK) >> 8; // 24

                $k += $s;

                $key[$ki] = $k &= $INT32_MASK;
                $salt[$si] = $s &= $INT32_MASK;
            }
        }

        return $key;
    }

    /**
     * Use a variation of Xorshift+ to mix the key
     *
     * @param   array $key List of int32 values representing the key
     * @param   int   $rounds Number of rounds to process the key
     *
     * @return  array A mixed key
     */
    public static function mixKey($key, $rounds = 1)
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

    public static function genSalt($seed = __FILE__)
    {
        return hash('sha1', dechex(mt_rand()) . $seed . microtime(), true);
    }

    public static function str2buf($str)
    {
        if (is_array($str)) return $str;
        $str = self::pad_right($str);
        return array_values(unpack('V' . (strlen($str) >> 2), $str));
    }

    public static function buf2str($buf)
    {
        // return pack('V*', ...$buf); // PHP 5.6+
        array_unshift($buf, 'V*');
        return call_user_func_array('pack', $buf);
    }

    /**
     * Pad a string on the right to the length of a multiple of 4
     *
     * @param   string  $str
     * @return  string
     */
    protected static function pad_right($str, $chr = "\x0")
    {
        $b = strlen($str) & 3 and
            $str .= str_repeat($chr[0], 4 - $b);
        return $str;
    }
}
