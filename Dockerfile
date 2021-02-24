FROM node:10-alpine as builder

COPY package.json package-lock.json ./

RUN npm install && mkdir /app-ui && mv ./node_modules ./app-ui

WORKDIR /app-ui

COPY . .

RUN npm run ng build -- --prod

FROM nginx:alpine

#!/bin/sh

COPY nginx.conf /etc/nginx/nginx.conf

## Remove default nginx index page
RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app-ui/dist /usr/share/nginx/html

ENTRYPOINT ["nginx", "-g", "daemon off;"]
