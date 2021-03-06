#!/bin/sh

# See https://www.fourmilab.ch/random/

dir=$(dirname "$(realpath "$0")")
base=$(dirname "$dir")
cycry="$base/bin/cycry.${1:-js}"

. "$dir/util.sh"

# Download the ent binary when missing
if ! ENT="$(command -v ent)"; then
    ENT="$base/vendor/bin/ent"
    if [ ! -x "$ENT" ]; then
        echo "Downloading random.zip..."
        curl -L -k -o /tmp/random.zip 'https://fourmilab.ch/random/random.zip' && \
        unzip -o /tmp/random.zip -d /tmp/random/ && \
        ( cd /tmp/random/ && make ) && \
        cp -f -- /tmp/random/ent "$ENT" || \
        ENT=
        echo
        echo
    fi
fi

# We use a very small sample size (10Mb) for speed
size=10000000
if [ -n "$ENT" ]; then
    echo;
    echo '----- /dev/urandom -----';
    _t_=$(timer)
    head -c $size /dev/urandom | "$ENT"
    _t_=$(timer "$_t_")
    echo "in ${_t_}ms, $(speed "$size" "$_t_")MBps"

    echo;
    echo '----- No salt, 32bit key -----';
    _t_=$(timer)
    head -c $size /dev/zero | "$cycry" -s 0x00000000 -k "$key32" | "$ENT"
    _t_=$(timer "$_t_")
    echo "in ${_t_}ms, $(speed "$size" "$_t_")MBps"

    echo;
    echo '----- No salt, 128bit key -----';
    _t_=$(timer)
    head -c $size /dev/zero | "$cycry" -s 0x00000000 -k "$key128" | "$ENT"
    _t_=$(timer "$_t_")
    echo "in ${_t_}ms, $(speed "$size" "$_t_")MBps"

    echo;
    echo '----- Salted 128bit key -----';
    _t_=$(timer)
    head -c $size /dev/zero | "$cycry" -so /dev/null -k "$key128" | "$ENT"
    _t_=$(timer "$_t_")
    echo "in ${_t_}ms, $(speed "$size" "$_t_")MBps"

    echo;
    echo '----- No salt, 1024bit key -----';
    _t_=$(timer)
    head -c $size /dev/zero | "$cycry" -s 0x00000000 -k "$key1024" | "$ENT"
    _t_=$(timer "$_t_")
    echo "in ${_t_}ms, $(speed "$size" "$_t_")MBps"

    echo;
    echo '----- Salted 1024bit key -----';
    _t_=$(timer)
    head -c $size /dev/zero | "$cycry" -so /dev/null -k "$key1024" | "$ENT"
    _t_=$(timer "$_t_")
    echo "in ${_t_}ms, $(speed "$size" "$_t_")MBps"
fi
