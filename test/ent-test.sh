#!/bin/sh

# See https://www.fourmilab.ch/random/

dir=$(dirname "$(realpath "$0")")
base=$(dirname "$dir")

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

timer() {
    now=$(date +%s.%N)
    if [ -n "$1" ]; then
        scale=$2
        [ -n "$scale" ] && scale="scale=$scale; "
        echo "$scale$now - $1" | bc -l
    else
        echo "$now"
    fi
}

speed() {
    echo "scale=2; $1 / $2 / 1048576" | bc -l
}

# We use a very small sample size (10Mb) for speed
# and a very bad/simple key.
size=10000000
key32=0x12345678
key128=0x0123456789ABCDEFFEDCBA9876543210
key1024="Why isn't the secret key of Cycles-Crypt a secret any more! 1234"
if [ -n "$ENT" ]; then
    echo;
    echo '----- /dev/urandom -----';
    _t_=$(timer)
    head -c $size /dev/urandom | "$ENT"
    _t_=$(timer "$_t_")
    echo "in $(echo "scale=2; $_t_ / 1" | bc -l)s, $(speed "$size" "$_t_")MBps"

    echo;
    echo '----- No salt, 32bit key -----';
    _t_=$(timer)
    head -c $size /dev/zero | php "$base/bin/cycry.php" -s 0x00000000 -k "$key32" | "$ENT"
    _t_=$(timer "$_t_")
    echo "in ${_t_}s, $(speed "$size" "$_t_")MBps"

    echo;
    echo '----- No salt, 128bit key -----';
    _t_=$(timer)
    head -c $size /dev/zero | php "$base/bin/cycry.php" -s 0x00000000 -k "$key128" | "$ENT"
    _t_=$(timer "$_t_")
    echo "in ${_t_}s, $(speed "$size" "$_t_")MMBps"

    echo;
    echo '----- Salted 128bit key -----';
    _t_=$(timer)
    head -c $size /dev/zero | php "$base/bin/cycry.php" -so /dev/null -k "$key128" | "$ENT"
    _t_=$(timer "$_t_")
    echo "in ${_t_}s, $(speed "$size" "$_t_")MBps"

    echo;
    echo '----- No salt, 1024bit key -----';
    _t_=$(timer)
    head -c $size /dev/zero | php "$base/bin/cycry.php" -s 0x00000000 -k "$key1024" | "$ENT"
    _t_=$(timer "$_t_")
    echo "in ${_t_}s, $(speed "$size" "$_t_")MBps"

    echo;
    echo '----- Salted 1024bit key -----';
    _t_=$(timer)
    head -c $size /dev/zero | php "$base/bin/cycry.php" -so /dev/null -k "$key1024" | "$ENT"
    _t_=$(timer "$_t_")
    echo "in ${_t_}s, $(speed "$size" "$_t_")MBps"
fi
