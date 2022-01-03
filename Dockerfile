FROM node:12-alpine

WORKDIR /app

COPY package.json .

RUN npm install

COPY . .

EXPOSE 8080

ENV MONGODB_USERNAME=root
ENV MONGODB_PASSWORD=pass

CMD ["npm", "start"]