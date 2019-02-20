#!/usr/bin/env bash

BFS="https://github.com/jvilk/BrowserFS/releases/download/v1.4.3/browserfs.min.js"
ZFS="https://github.com/jvilk/browserfs-zipfs-extras/releases/download/v1.0.1/browserfs-zipfs-extras.js"
MAP="https://github.com/jvilk/browserfs-zipfs-extras/releases/download/v1.0.1/browserfs-zipfs-extras.js.map"
FULL="https://raw.githubusercontent.com/sindresorhus/screenfull.js/v3.3.3/dist/screenfull.min.js"
SAVE="https://raw.githubusercontent.com/eligrey/FileSaver.js/master/dist/FileSaver.min.js"
CTB="https://raw.githubusercontent.com/eligrey/canvas-toBlob.js/master/canvas-toBlob.js"

echo "Fetching BrowserFS"
wget -nc -O libs/browserfs.min.js $BFS

echo "Fetching BrowserFS ZipFS"
wget -nc -O libs/browserfs-zipfs-extras.js $ZFS
wget -nc -O libs/browserfs-zipfs-extras.js.map $MAP

echo "Fetching screenfull"
wget -nc -O libs/screenfull.min.js $FULL

echo "Fetching FileSaver"
wget -nc -O libs/FileSaver.min.js $SAVE

echo "Fetching canvas-toBlob"
wget -nc -O libs/canvas-toBlob.js $CTB