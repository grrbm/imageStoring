#!/bin/sh


file="../samples/image10.jpg"
echo "file: $file"; 
curl -X PUT -F caption="image1" -F file=@$file http://localhost:8080/api/update
echo -e "\ndone Updating image1 with file $file. run demoR again and check output/outputImage1.jpg"
