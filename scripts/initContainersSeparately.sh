#!/bin/sh
docker container kill $(docker ps -q)
docker system prune -f
docker volume rm data #run this command if you want to completely restart the database, clearing all data
echo "done killing all running containers"
docker network create mern-net
echo "created network mern-net"
docker run --name mongodb -v /"$(pwd)"/mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js -v data:/data/db --rm -d -p 27017:27017 --network mern-net mongo --bind_ip 0.0.0.0 --port 27017
echo "done creating mongodb instance"
docker build -t image-storing ../
echo "done building"
#docker run -d -e APP_PORT=8080 -e APP_HOST=localhost -e DAT_PORT=27017 -e DAT_HOST=localhost -p 8080:8080 --network mern-net image-storing
docker run -d -e APP_PORT=8080 -e APP_HOST=0.0.0.0 -e DAT_PORT=27017 -e DAT_HOST=mongodb -e MONGODB_USERNAME=myUserAdmin -e MONGODB_PASSWORD=pass -d --rm -p 8080:8080 --network mern-net image-storing
echo "done executing image-storing service"
