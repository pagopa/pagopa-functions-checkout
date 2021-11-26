FROM node:12.19.1

WORKDIR /usr/src/app

COPY pagopaproxy-mock-server.js /usr/src/app/server.js

COPY ./docker/proxy-mock/package*.json ./

RUN npm install

CMD [ "node", "server.js" ]