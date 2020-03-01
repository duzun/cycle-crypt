#!/bin/sh

# Use very bad/simple keys
export key32=0x12345678
export key128=0x0123456789ABCDEFFEDCBA9876543210
export key1024="Why isn't the secret key of Cycles-Crypt a secret any more! 1234"

timer() {
    now="$(date +%s.%N)/.001"
    [ -n "$1" ] && now="$now-$1"
    echo "scale=0; $now" | bc -l
}

speed() {
    echo "scale=2; $1 / $2 / 1048.576" | bc -l
}


cpu_model() {
    lscpu | grep 'Model name' | cut -d':' -f2 | sed -r 's/^[[:space:]]*//g'
}
