<?php

declare(strict_types=1);

namespace duzun;

use duzun\CycleCrypt;

// ---------------------------------------------------------------
/**
 * Variable size symmetric key encryption algorithm.
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
    // Use the salt prepended to the data
    if ($salt === false) {
        $i = ord($data[0]);
        $salt = substr($data, 1, $i);
        $data = substr($data, $i + 1);
    }

    $cc = new CycleCrypt($key, $salt);
    $ret = $cc($data);

    // Generate salt and prepend it to the result
    if ($salt === true) {
        $salt = $cc->getSalt();
        $ret = chr(strlen($salt)) . $salt . $ret;
    }

    return $ret;
}
