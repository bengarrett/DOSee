# DOSee Dockerfile
#
# Instructions for use:
#
# docker build -t dosee .
# docker run --name dosee_app -i -p 8086:80 dosee
#
# docker build --tag dosee:latest .
# docker run --name dosee_app --interactive --publish 8086:80 dosee:latest
#
#
# To remove and cleanup:
#
# docker stop dosee_app
# docker container rm dosee_app
# docker image rm dosee

# Multi-stage Docker build to reduce the overall image size
# DOSee will be built in this temporary Node.JS image
FROM node:current-alpine AS build

# Install and update the build dependencies
RUN apk update &&  \
    apk add --update yarn && \
    npm update --global npm

# Copy source files
COPY . /dosee

# Compile and build DOSee
WORKDIR /dosee
RUN yarn install --audit --production

# DOSee will be served on this permanent nginx image
# It should only ammount to around 50 MB in size
# The nginx stable image is used due to its less frequent updates
FROM nginx:stable-alpine
LABEL net.dosee.description="DOSee an MS-DOS emulator for the web"

# Copy DOSee from the build image to the nginx webroot
RUN rm /usr/share/nginx/html/*
COPY --from=build /dosee/build/ /usr/share/nginx/html
