FROM node:alpine

ARG PACKAGES=nano

ENV TERM xterm
RUN apk update && apk add $PACKAGES

WORKDIR /var/www
COPY package*.json ./
RUN yarn install

COPY . ./
EXPOSE 3000

ENTRYPOINT ["yarn", "dev"]
