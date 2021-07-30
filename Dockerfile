FROM node:14

RUN mkdir /app
WORKDIR /app

COPY package.json .
COPY package-lock.json .
RUN npm install

COPY server.js .
COPY lib lib
COPY controllers controllers

COPY client client

CMD node server.js