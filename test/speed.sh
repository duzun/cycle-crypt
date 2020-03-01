#!/bin/sh

dir=$(dirname "$(realpath "$0")")
base=$(dirname "$dir")
cycry="$base/bin/cycry.${1:-js}"
# 500Mb
size=${2:-500000000}

. "$dir/util.sh"

# echo;
# cpu_model

echo;
echo -n '- No salt, 32bit   key: ';
_t_=$(timer)
_s_=$(head -c $size /dev/zero | "$cycry" -s 0x00000000 -k "$key32" | wc -c)
_t_=$(timer "$_t_")
echo "in ${_t_}ms, $(speed "$size" "$_t_")MBps"

echo -n '- No salt, 128bit  key: ';
_t_=$(timer)
_s_=$(head -c $size /dev/zero | "$cycry" -s 0x00000000 -k "$key128" | wc -c)
_t_=$(timer "$_t_")
echo "in ${_t_}ms, $(speed "$size" "$_t_")MBps"

echo -n '- Salted   128bit  key: ';
_t_=$(timer)
_s_=$(head -c $size /dev/zero | "$cycry" -so /dev/null -k "$key128" | wc -c)
_t_=$(timer "$_t_")
echo "in ${_t_}ms, $(speed "$size" "$_t_")MBps"

echo -n '- No salt, 1024bit key: ';
_t_=$(timer)
_s_=$(head -c $size /dev/zero | "$cycry" -s 0x00000000 -k "$key1024" | wc -c)
_t_=$(timer "$_t_")
echo "in ${_t_}ms, $(speed "$size" "$_t_")MBps"

echo -n '- Salted   1024bit key: ';
_t_=$(timer)
_s_=$(head -c $size /dev/zero | "$cycry" -so /dev/null -k "$key1024" | wc -c)
_t_=$(timer "$_t_")
echo "in ${_t_}ms, $(speed "$size" "$_t_")MBps"
