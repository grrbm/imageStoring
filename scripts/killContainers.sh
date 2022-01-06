docker container kill $(docker ps -q)
docker system prune -f
docker volume rm data #run this command if you want to completely restart the database, clearing all data