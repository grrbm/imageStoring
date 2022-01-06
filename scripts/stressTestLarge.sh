#!/bin/sh

#To find more large images to test with,
#visit: https://svs.gsfc.nasa.gov/vis/a030000/a030800/a030877/frames/5760x3240_16x9_01p/

for counter in {1..100}; 
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