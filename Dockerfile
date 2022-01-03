#1
FROM node:12.13.0-alpine

#2
RUN mkdir -p /srv/app/admin-server
WORKDIR /srv/app/admin-server

#INSTALL CURL
RUN apk add --no-cache curl

#3
COPY package.json /srv/app/admin-server
COPY package-lock.json /srv/app/admin-server
COPY .env /srv/app/admin-server

#4
RUN npm install --silent

#5
COPY . /srv/app/admin-server

#6
CMD [ "npm", "start" ]