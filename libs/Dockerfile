FROM alpine
LABEL maintainer="code.by.ben@gmail.com"
ENV BFS="https://github.com/jvilk/BrowserFS/releases/download/v1.4.3/browserfs.min.js"
ENV ZFS="https://github.com/jvilk/browserfs-zipfs-extras/releases/download/v1.0.1/browserfs-zipfs-extras.js"
ENV MAP="https://github.com/jvilk/browserfs-zipfs-extras/releases/download/v1.0.1/browserfs-zipfs-extras.js.map"
ENV FULL="https://raw.githubusercontent.com/sindresorhus/screenfull.js/gh-pages/dist/screenfull.min.js"
ENV SAVE="https://raw.githubusercontent.com/eligrey/FileSaver.js/master/src/FileSaver.js"
ENV CTB="https://raw.githubusercontent.com/eligrey/canvas-toBlob.js/master/canvas-toBlob.js"
RUN apk add --update wget
RUN mkdir -p /opt/libs
VOLUME /opt/libs
RUN wget -nc -O /opt/libs/browserfs.min.js $BFS
RUN wget -nc -O /opt/libs/browserfs-zipfs-extras.js $ZFS
RUN wget -nc -O /opt/libs/browserfs-zipfs-extras.js.map $MAP
RUN wget -nc -O /opt/libs/screenfull.min.js $FULL
RUN wget -nc -O /opt/libs/FileSaver.min.js $SAVE
RUN wget -nc -O /opt/libs/canvas-toBlob.js $CTB
RUN ls -l /opt/libs