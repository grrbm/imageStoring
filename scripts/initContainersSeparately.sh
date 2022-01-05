#!/bin/sh
docker container kill $(docker ps -q)
docker system prune -f
echo "done killing all running containers"
docker network create mern-net
echo "created network mern-net"
docker run --name mongodb -v data:/data/db --rm -d -p 27017:27017 --network mern-net mongo
echo "done creating mongodb instance"
docker build -t image-storing ../
echo "done building"
#docker run -d -e APP_PORT=8080 -e APP_HOST=localhost -e DAT_PORT=27017 -e DAT_HOST=localhost -p 8080:8080 --network mern-net image-storing
docker run -d -e APP_PORT=8080 -e APP_HOST=localhost -e MONGODB_USERNAME=myUserAdmin -e MONGODB_PASSWORD=pass -d --rm -p 8080:8080 --network mern-net image-storing
echo "done executing image-storing service"
