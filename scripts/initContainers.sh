#!/bin/sh
docker container kill $(docker ps -q)
docker system prune -f
echo "done killing all running containers"
docker build -t image-storing ../
echo "done building"
docker-compose build
echo "done docker-compose build"
docker-compose up
echo "done running"
