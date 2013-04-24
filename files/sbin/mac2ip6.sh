#!/bin/sh

# Create an IPv6 address based on a prefix and
# the 64-bit Extended Unique Identifier (EUI-64).

mac=$1
prefix=`uci get -q freifunk.@settings[0].ff_prefix`

[ -z "$mac" -o -z "$ff_prefix" -o ${#mac} -ne 17 ] && exit 1


#translate to local administered mac
a=${mac%%:*} #cut out first hex
a=$((0x$a | 2)) #set second bit to 1
a=`printf '%02x\n' $a` #convert to hex
mac="$a:${mac#*:}"

#insert FFEE
mac=${mac//:/}
mac=${mac:0:6}FFFE${mac:6:6}
mac=`echo $mac | sed 's/..../&:/g'`

# assemble ip
echo "$prefix${mac%?}"
