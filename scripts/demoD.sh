#!/bin/sh

i=0
for file in ../samples/*; 
do 
    ((++i))
    echo "file: $file"; 
    curl -X DELETE -d guid="image$i" http://localhost:8080/api/delete
    echo -e "\ndone deleting file $file."
done