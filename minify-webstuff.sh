#!/bin/bash
# Function: Minify css/js files

aminify=(`find ./files/www/ -name "*.css" -o -name "*.js"`)

for minifyme in "${aminify[@]}"; do
    echo "- minifying: $minifyme"
    yui-compressor $minifyme -o $minifyme
done

aminify=(`find ./files/www/ -name "*.html"`)
for minifyme in "${aminify[@]}"; do
    echo "- minifying: $minifyme"
    sed -i ':a;N;$!ba;s/>\s*</></g' $minifyme
done


