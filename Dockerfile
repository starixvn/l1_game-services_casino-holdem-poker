FROM registry.nexdev.net:5050/docker/node:14.15.1-slim AS builder

WORKDIR /app
COPY package.json yarn.lock ./
RUN npm run reg
RUN yarn install --production
COPY ./src/ .
COPY .modprunerrc .
RUN npm install -g mod-pruner && mod-pruner prune --force && rm .modprunerrc

FROM registry.nexdev.net:5050/docker/node:14.15.1-slim

USER root

ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV
RUN mkdir /app && chown node:node /app

WORKDIR /app
COPY --from=builder /app ./
ENV PATH /app/node_modules/.bin:$PATH
HEALTHCHECK --interval=10s CMD node --es-module-specifier-resolution=node healthcheck.js

CMD [ "node", "--es-module-specifier-resolution=node", "./app.js" ]
