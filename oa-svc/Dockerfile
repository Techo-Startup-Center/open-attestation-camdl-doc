FROM node:16-alpine3.18 AS base

WORKDIR /usr/src/app

COPY . .

# RUN rm .env

# RUN rm wallet.json

RUN rm -rf node_modules

RUN yarn --frozen-lockfile

# for production

FROM node:16-alpine3.18

WORKDIR /usr/src/app

COPY package*.json yarn.lock* ./

RUN yarn --frozen-lockfile --prod

COPY --from=base /usr/src/app/ ./

EXPOSE 3000

ENTRYPOINT ["node","./app.js"]