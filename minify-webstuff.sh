#!/bin/bash
# Function: Minify css/js files

aminify=(`find ./files/www/ -name "*.css" -o -name "*.js"`)

for minifyme in "${aminify[@]}"; do
    echo "$minifyme"
    yui-compressor $minifyme > "$minifyme.tmp"
    mv "$minifyme.tmp" $minifyme
done
