#!/bin/sh

i=0
for file in ../samples/*; 
do 
    ((++i))
    echo "file: $file"; 
    curl -X GET -d caption="image$i" http://localhost:8080/api/read --output "../output/outputImage$i.jpg"
    echo -e "\ndone reading file $file."
done