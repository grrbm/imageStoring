#!/bin/sh
docker container kill $(docker ps -q)
docker system prune -f
echo "done killing all running containers"
docker build -t image-storing ../
echo "done building"
docker run -d -e APP_PORT=8080 -e APP_HOST=localhost -e DAT_PORT=2717 -e DAT_HOST=localhost -p 8080:8080 image-storing
echo "done executing image-storing service"
docker run -d -p 2717:27017 -v data:/data/db -d -e MONGO_INITDB_ROOT_USERNAME=someuser -e MONGO_INITDB_ROOT_PASSWORD=pass123 --name mymongo mongo
echo "done creating mongodb instance"