#!/bin/sh

while i=$(inotifywait -qre modify --exclude ".git|node_modules|vendor" ./); do
    set -- $i;
    # dir=$1
    evt=$2
    file=$3
    ext=${file##*.}
    echo "$evt '$file'";

    case $ext in
        php) make test_php ;;
        js) make test_js ;;
    esac
    # make run_test
done
