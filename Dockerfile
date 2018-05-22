FROM node:8-alpine

WORKDIR /src

COPY package.json yarn.lock ./

RUN yarn install

COPY . .

CMD ["bin/gnat-grpc-cdc-broker"]
