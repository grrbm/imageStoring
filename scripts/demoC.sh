#!/bin/sh

for i in {1..10}
do
  echo "counter: $i"
  MY_NAME=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c10)
  curl -X POST -F caption=$MY_NAME -F file=@image1.jpg http://localhost:8080/api/create
  echo "done uploading file $MY_NAME."
done
# curl -X POST -v -F caption=valueKK -F file=@image1.jpg http://localhost:8080/api/create
