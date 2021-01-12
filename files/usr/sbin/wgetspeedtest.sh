#!/bin/sh


if [ "$1" = "-w" ]; then
  mkdir -p /tmp/
  mkdir -p /tmp/log/
fi

TESTIP6=$(nslookup "ipv6.download2.thinkbroadband.com" 2a02:2970:1002::18 | grep -oE "^Address .*" | grep -oE '([a-f0-9:]+:+)+[a-f0-9]+')
TESTIP4=$(nslookup "ipv4.download.thinkbroadband.com" 46.182.19.48 | grep -oE "^Address .*" | grep -oE '[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}')
MYFFGW=$(sockread /var/run/fastd.status < /dev/null 2> /dev/null | sed 's/\(.*\)"name": "gw\([0-9]*\)[^"]*"\(.*\)established\(.*\)/\2/g')
MYNAME="$(uci -q get freifunk.@settings[0].name 2> /dev/null)"

# Determine last Speedresult and decide about test-size depending on that
LASTFFMBIT=0
if [ -f /tmp/log/last_speedtest_wan_mbps.txt ]; then
 LASTFFMBIT=$(cat /tmp/log/last_speedtest_ff_mbps.txt)
 LASTFFMBIT=$(awk "BEGIN{printf \"%3.0f\", $LASTFFMBIT}")
fi

if [ $LASTFFMBIT -gt 10 ]; then
 TESTURL4="http://ipv4.download.thinkbroadband.com/100MB.zip"
 TESTURL6="http://ipv6.download2.thinkbroadband.com/100MB.zip"
 AMOUNT=$((100 * 8))
elif  [ $LASTFFMBIT -gt 5 ]; then
 TESTURL4="http://ipv4.download.thinkbroadband.com/50MB.zip"
 TESTURL6="http://ipv6.download2.thinkbroadband.com/50MB.zip"
 AMOUNT=$((50 * 8))
elif  [ $LASTFFMBIT -gt 2 ]; then
 TESTURL4="http://ipv4.download.thinkbroadband.com/20MB.zip"
 TESTURL6="http://ipv6.download2.thinkbroadband.com/20MB.zip"
 AMOUNT=$((20 * 8))
elif  [ $LASTFFMBIT -gt 1 ]; then
 TESTURL4="http://ipv4.download.thinkbroadband.com/10MB.zip"
 TESTURL6="http://ipv6.download2.thinkbroadband.com/10MB.zip"
 AMOUNT=$((10 * 8))
else
 TESTURL4="http://ipv4.download.thinkbroadband.com/5MB.zip"
 TESTURL6="http://ipv6.download2.thinkbroadband.com/5MB.zip"
 AMOUNT=$((5 * 8))
fi

# Determine FF-Gateway
case $MYFFGW in
  01)
    MYFFGWIP6="fdef:1701:b5ee:23::1"
    MYFFGWIP4="10.15.224.1"
    ;;
  02)
    MYFFGWIP6="fdef:1701:b5ee:23::2"
    MYFFGWIP4="10.15.224.2"
    ;;
  03)
    MYFFGWIP6="fdef:1701:b5ee:23::3"
    MYFFGWIP4="10.15.224.3"
    ;;
  04)
    MYFFGWIP6="fdef:1701:b5ee:23::4"
    MYFFGWIP4="10.15.224.4"
    ;;
  *)
    echo "Unknown FF-Gateway: GW"$MYFFGW
    exit
    ;;
esac

echo "Starting WGET-Speedtests"
echo "========================"
echo
echo "Last FF-Speedtestresult: $LASTFFMBIT Mbit/s"
echo 

echo "Node-Name: "$MYNAME
echo "Active FF-Gateway: GW"$MYFFGW
echo "Map-Entry: https://mate.ffbsee.net/meshviewer/index.html#!/de/map/"$(uci -q get network.freifunk.macaddr | sed 's/:\|//g')
echo

echo ">> Starting Download-Tests with $AMOUNT Mbits on " $(date) 
STARTWAN=$(date +%s)
wget -4 -q -O /dev/null $TESTURL4
wgetreturn=$?
if [[ $wgetreturn = 0 ]]; then
 ENDWAN=$(date +%s)
 echo "WAN Download via IPv4 done"
 DURATIONWAN=$(awk "BEGIN {print $ENDWAN - $STARTWAN}")
 if [ $DURATIONWAN == 0 ]; then
  DURATIONWAN=1
 fi
 RESULTWAN=$(awk "BEGIN {print $AMOUNT/$DURATIONWAN}")
 echo "WAN: "$AMOUNT "Mbit in " $DURATIONWAN " seconds."
 echo "That's " $RESULTWAN "Mbit/s."
 echo
else
 echo "ERROR: WAN-Wget-Download via IPv4 failed. (Exit-Code: $wgetreturn)"
 STARTWAN=$(date +%s)
 wget -6 -q -O /dev/null $TESTURL6
 wgetreturn=$?
 if [[ $wgetreturn = 0 ]]; then
  ENDWAN=$(date +%s)
  echo "WAN Download via IPv6 done."
 DURATIONWAN=$(awk "BEGIN {print $ENDWAN - $STARTWAN}")
 if [ $DURATIONWAN == 0 ]; then
  DURATIONWAN=1
 fi
 RESULTWAN=$(awk "BEGIN {print $AMOUNT/$DURATIONWAN}")
 echo "WAN: "$AMOUNT "Mbit in " $DURATIONWAN " seconds."
 echo "That's " $RESULTWAN "Mbit/s."
 echo
 if [ "$1" = "-w" ]; then
  echo $STARTWAN > /tmp/log/last_speedtest_ts.txt
  echo $RESULTWAN > /tmp/log/last_speedtest_wan_mbps.txt
 fi
 else
  echo "ERROR: WAN-Wget-Download via IPv6 failed. (Exit-Code: $wgetreturn)"
  RESULTWAN=0
 fi
fi

echo
echo ">> Pinging my Gateway: $MYFFGW at $MYFFGWIP6"
GWPING6=$(ping -I br-freifunk -c 3 -n $MYFFGWIP6 | grep "round-trip min" | grep -oE '([0-9][0-9\.\/]*)' | sed -r 's/[0-9\.]+\/([0-9\.]+)\/[0-9\.]+/\1/g')
GWPING6=$(awk "BEGIN{printf \"%3.0f\", $GWPING6}")
echo "Ping-Duration (IPv6): $GWPING6 ms"

echo
echo ">> Pinging my Gateway: $MYFFGW at $MYFFGWIP4"
GWPING4=$(ping -I br-freifunk -c 3 -n $MYFFGWIP4 | grep "round-trip min" | grep -oE '([0-9][0-9\.\/]*)' | sed -r 's/[0-9\.]+\/([0-9\.]+)\/[0-9\.]+/\1/g')
GWPING4=$(awk "BEGIN{printf \"%3.0f\", $GWPING4}")
echo "Ping-Duration (IPv4): $GWPING4 ms"

if [[ $GWPING6 -gt 0 ]]; then
 GWPING=$GWPING6
else
 GWPING=$GWPING4 
fi

if [[ "$1" = "-w" && $GWPING -gt 0  ]]; then
  echo $GWPING > /tmp/log/last_gwping.txt
fi

echo
echo ">> Initiating Wget-Speedtest (IPv6-Download) via br-freifunk"
echo "Target-Url:" $TESTURL6
echo "Establish Test-Route by command: ip route add $TESTIP6/128 via $MYFFGWIP6"
echo

ip route add $TESTIP6/128 via $MYFFGWIP6
STARTFF=$(date +%s)
wget -6 -q -O /dev/null $TESTURL6
wgetreturn=$?
if [ $wgetreturn = 0 ]; then
 ENDFF=$(date +%s)
 echo "FF Download Done"
 ip route del $TESTIP6/128 via $MYFFGWIP6
 DURATIONFF=$(awk "BEGIN {print $ENDFF - $STARTFF}")
 RESULTFF=$(awk "BEGIN {print $AMOUNT/$DURATIONFF}")
 echo "FF: "$AMOUNT "Mbit in " $DURATIONFF " seconds."
 echo "That's " $RESULTFF "Mbit/s."
else
 echo "ERROR: FF-Wget-Download via IPv6 failed. (Exit-Code: $wgetreturn)"
 ip route del $TESTIP6/128 via $MYFFGWIP6
 RESULTFF=0
fi

if [[ $wgetreturn != 0 ]]; then
 echo
 echo ">> Initiating Wget-Speedtest (IPv4) via br-freifunk"
 echo "Target-Url:" $TESTURL4
 echo "Establish Test-Route by command: ip route add $TESTIP4/32 via $MYFFGWIP4"
 echo
 ip route add $TESTIP4/32 via $MYFFGWIP4
 STARTFF=$(date +%s)
 wget -4 -q -O /dev/null $TESTURL4
 wgetreturn=$?
 if [[ $wgetreturn = 0 ]]; then
  ENDFF=$(date +%s)
  echo "FF Download Done"
  ip route del $TESTIP4/32 via $MYFFGWIP4
  DURATIONFF=$(awk "BEGIN {print $ENDFF - $STARTFF}")
  RESULTFF=$(awk "BEGIN {print $AMOUNT/$DURATIONFF}")
  echo "FF: "$AMOUNT "Mbit in " $DURATIONFF " seconds."
  echo "That's " $RESULTFF "Mbit/s."
 else
  echo "ERROR: FF-Wget-Download via IPv4 failed. (Exit-Code: $wgetreturn)"
  ip route del $TESTIP4/32 via $MYFFGWIP4
  RESULTFF=0
 fi
fi

echo
echo "All Download-Tests finished. " $(date) 
echo 

if [[ "$1" = "-w" && $RESULTFF -gt 0 ]]; then
  echo $RESULTFF > /tmp/log/last_speedtest_ff_mbps.txt
  echo $STARTWAN > /tmp/log/last_speedtest_ts.txt
fi
