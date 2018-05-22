FROM node:8-alpine

ENV PORT=5555 ROOT=contract

WORKDIR /src

COPY package.json yarn.lock ./

RUN yarn install

COPY . .

CMD ["bin/gnat-grpc-cdc-broker", "-p", "$PORT", "-t", "ROOT"]
