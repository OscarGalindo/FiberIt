FROM node:8

RUN mkdir /app

COPY package.json /app
RUN npm install
COPY . /app

WORKDIR /app

RUN npm test
RUN npm run build
