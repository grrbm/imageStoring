#!/bin/sh

i=0
for file in ../samples/*; 
do 
    ((++i))
    echo "file: $file"; 
    curl -X POST -F caption="image$i" -F file=@$file http://localhost:8080/api/create
    echo -e "\ndone uploading file $MY_NAME."
done