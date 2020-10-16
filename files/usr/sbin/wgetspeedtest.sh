#!/bin/sh
MYWANGW=$(ip route show default | grep -oE 'via .* dev' | grep -oE '((1?[0-9][0-9]?|2[0-4][0-9]|25[0-5])\.){3}(1?[0-9][0-9]?|2[0-4][0-9]|25[0-5])')
HOSTv4=$(nslookup "speed.hetzner.de" | grep -oE "^Address .*" | grep -oE '((1?[0-9][0-9]?|2[0-4][0-9]|25[0-5])\.){3}(1?[0-9][0-9]?|2[0-4][0-9]|25[0-5])')
AMOUNT=$((100 * 8))
MYFFGW=$(sockread /var/run/fastd.status < /dev/null 2> /dev/null | sed 's/\(.*\)"name": "gw\([0-9]*\)[^"]*"\(.*\)established\(.*\)/\2/g')
case $MYFFGW in
  01)
    MYFFGWIP="10.15.224.1"
    ;;
  02)
    MYFFGWIP="10.15.224.2"
    ;;
  03)
    MYFFGWIP="10.15.224.3"
    ;;
  04)
    MYFFGWIP="10.15.224.4"
    ;;
  *)
    echo "Unknown FF-Gateway: GW"$MYFFGW
    exit
    ;;
esac

ip route add $HOSTv4/32 via $MYWANGW
STARTWAN=$(date +%s)
wget -4 -q --no-check-certificate -O /dev/null "https://speed.hetzner.de/100MB.bin"
wgetreturn=$?
if [[ $wgetreturn = 0 ]]; then
 ENDWAN=$(date +%s)
 echo "WAN Download Done"
 ip route del $HOSTv4/32 via $MYWANGW
else
 echo "ERROR: Wan-Wget-Download failed."
 ip route del $HOSTv4/32 via $MYWANGW
 exit
fi

DURATIONWAN=$(awk "BEGIN {print $ENDWAN - $STARTWAN}")
RESULTWAN=$(awk "BEGIN {print $AMOUNT/$DURATIONWAN}")

echo "WAN: "$AMOUNT "Mbit in " $DURATIONWAN " seconds."
echo "That's " $RESULTWAN "Mbit/s."
echo


ip route add $HOSTv4/32 via $MYFFGWIP
STARTFF=$(date +%s)
wget -4 -q --no-check-certificate -O /dev/null "https://speed.hetzner.de/100MB.bin"
wgetreturn=$?
if [[ $wgetreturn = 0 ]]; then
 ENDFF=$(date +%s)
 echo "FF Download Done"
 ip route del $HOSTv4/32 via $MYFFGWIP
else
 echo "ERROR: FF-Wget-Download failed.($wgetreturn)"
 ip route del $HOSTv4/32 via $MYFFGWIP
 exit
fi

DURATIONFF=$(awk "BEGIN {print $ENDFF - $STARTFF}")
RESULTFF=$(awk "BEGIN {print $AMOUNT/$DURATIONFF}")

echo "FF: "$AMOUNT "Mbit in " $DURATIONFF " seconds."
echo "That's " $RESULTFF "Mbit/s."
echo

if [ "$1" = "-w" ]; then
  echo $RESULTFF > last_speedtest_ff_mbps.txt
  echo $RESULTWAN > last_speedtest_wan_mbps.txt
  echo $STARTWAN > last_speedtest_ts.txt
fi
