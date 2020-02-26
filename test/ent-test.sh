#!/bin/sh

# See https://www.fourmilab.ch/random/

dir=$(dirname "$(realpath "$0")")
base=$(dirname "$dir")

if ! ENT=$(command -v ent); then
    ENT="$base/vendor/bin/ent"
    if [ ! -x "$ENT" ]; then
        curl -L -k -o /tmp/random.zip 'https://fourmilab.ch/random/random.zip' && \
        unzip -o /tmp/random.zip -d /tmp/random/ && \
        ( cd /tmp/random/ && make ) && \
        cp -f -- /tmp/random/ent "$ENT" || \
        ENT=
    fi
fi

if [ -n "$ENT" ]; then
    head -c 300000 /dev/zero | php "$base/bin/cycry.php" -s 0x00000000 -k 0x12345678 | "$ENT"
fi
