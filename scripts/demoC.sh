#!/bin/sh

for file in ../samples/*; 
do 
    echo "file: $file"; 
    MY_NAME=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c10)
    curl -X POST -F caption=$MY_NAME -F file=@$file http://localhost:8080/api/create
    echo -e "\ndone uploading file $MY_NAME."
done