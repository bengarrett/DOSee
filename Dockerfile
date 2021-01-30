# DOSee Dockerfile to load an nginx webhost server

# Instructions to build and run:
#
# docker build --tag dosee:latest .
# docker run --name dosee_app --interactive --publish 8086:80 dosee:latest
#
# Or in short form:
# docker build -t dosee .
# docker run --name dosee_app -i -p 8086:80 dosee
#
# Instruction to remove and cleanup:
# docker stop dosee_app
# docker container rm dosee_app
# docker image rm dosee

# nginx stable is used due to its less frequent updates
# alpine is a tiny linux distribution
FROM nginx:stable-alpine AS dosee
LABEL net.dosee.description="DOSee - A MS-DOS emulator for the web"

COPY src/ /home/nginx/src
COPY package.json workbox-config.js /home/nginx/

# install dependencies and build the site
RUN mkdir -p /home/nginx/src
WORKDIR /home/nginx/
RUN apk add --update nodejs npm && \
    npm install --global yarn && \
    yarn --production && \
    cp -r /home/nginx/build/* /usr/share/nginx/html/

WORKDIR /usr/share/nginx/html/

# cleanup to reduce the image from 250M down to 56M.
RUN rm -R /home/nginx && \
    yarn cache clean && \
    npm -g uninstall yarn && \
    npm cache clean --force && \
    apk del nodejs npm && \
    du -hs /

# optional cleanup

# serve internally over HTTP port 80
EXPOSE 80