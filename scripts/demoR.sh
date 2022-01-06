#!/bin/sh

i=0
for file in ../samples/*; 
do 
    ((++i))
    echo "file: $file"; 
    if [[ $(curl -s -X GET -d guid="image$i" http://localhost:8080/api/exists -w "%{http_code}") -eq "200" ]]
    #if [[ 11 -gt 10 ]]
    then
        echo "Image exists. Fetching"
        curl -X GET http://localhost:8080/api/read/image$i --output "../output/outputImage$i.jpg" --max-time 3
        echo -e "\ndone reading file $file. check output folder"
    else
        echo "Failed. Does image exist in the database ?"
    fi
done