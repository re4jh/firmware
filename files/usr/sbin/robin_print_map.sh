#!/bin/sh
#Print out local connection data for map creation

# get a speedtestresult if none is found
[ ! -f /tmp/log/last_speedtest_ts.txt ] && ./wgetspeedtest.sh -w
# get a speedtestresult if the one found is older than 1 day
[[ $(cat /tmp/log/last_speedtest_ts.txt) -lt $(awk "BEGIN {print $(date +%s) - 3600 * 24}") ]]  && ./wgetspeedtest.sh -w

wan_mbps=$(cat /tmp/log/last_speedtest_wan_mbps.txt)
ff_mbps=$(cat /tmp/log/last_speedtest_ff_mbps.txt)

# speed_ping=$(cat speedtestresult.json | jq '.ping')
test_ts=$(cat /tmp/log/last_speedtest_ts.txt)
speed_when=$(date -d @$test_ts +'%Y-%m-%d %H:%M:%S')
rx_bytes=$(cat /sys/class/net/br-freifunk/statistics/rx_bytes)
tx_bytes=$(cat /sys/class/net/br-freifunk/statistics/tx_bytes)

content="{"

[ -n "$wan_mbps" ] && content=$content"\"downstream_mbits_wan\" : $wan_mbps, "
[ -n "$ff_mbps" ] && content=$content"\"downstream_mbits_ff\" : $ff_mbps, "
[ -n "$speed_when" ] && content=$content"\"tested_when\" : \"$speed_when\", "
[ -n "$rx_bytes" ] && content=$content"\"rx_bytes\" : $rx_bytes, "
[ -n "$tx_bytes" ] && content=$content"\"tx_bytes\" : $tx_bytes"

content=$content"}"

if [ "$1" = "-p" ]; then

	if [ -n "$content" ]; then
		#make sure alfred is running
    pidof alfred > /dev/null || /etc/init.d/alfred start

		#publish content via alfred
		echo "$content" | /usr/sbin/alfred -s 69 -u /var/run/alfred.sock

		echo "map published"
	else
		echo "nothing published"
	fi
else
	echo  $content
fi
