#!/bin/sh

i=0
for file in ../samples/*; 
do 
    ((++i))
    echo "file: $file"; 
    curl -s -o nul -X POST -F guid="image$i" -F file=@$file http://localhost:8080/api/create
    echo -e "\ndone uploading file $MY_NAME."
done