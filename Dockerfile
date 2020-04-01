# DOSee Dockerfile to load an nginx server

# Instructions to build and run:
#
# docker build --tag dosee:latest .
# docker run --name dosee_app --interactive --publish 8086:80 dosee:latest
#
# or in short form
# docker build -t dosee .
# docker run --name dosee_app -i -p 8086:80 dosee
#
# Instruction to remove and cleanup:
# docker stop dosee_app
# docker container rm dosee_app
# docker image rm dosee

# nginx stable is used due to its less frequent updates
# alpine is a tiny linux distribution
FROM nginx:stable-alpine
LABEL net.dosee.description="DOSee an MS-DOS emulator for the web"
COPY build/ /usr/share/nginx/html/