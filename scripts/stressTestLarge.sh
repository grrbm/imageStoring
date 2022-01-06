#!/bin/sh

for counter in {1..10}; 
do
((++counter))
i=0
    for file in ../samplesLarge/*; 
    do 
        ((++i))
        echo "file: $file"; 
        curl -X POST -F guid="LargeImage$counter" -F file=@$file http://localhost:8080/api/create
        echo -e "\ndone uploading file."
        curl -X DELETE -d guid="LargeImage$counter" http://localhost:8080/api/delete
        echo -e "\ndone deleting file LargeImage$counter."
    done
done