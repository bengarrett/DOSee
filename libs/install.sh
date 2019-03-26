#!/usr/bin/env bash

BFS="https://github.com/jvilk/BrowserFS/releases/download/v1.4.3/browserfs.min.js"
ZFS="https://github.com/jvilk/browserfs-zipfs-extras/releases/download/v1.0.1/browserfs-zipfs-extras.js"
SAVE="https://raw.githubusercontent.com/eligrey/FileSaver.js/master/dist/FileSaver.min.js"
CTB="https://raw.githubusercontent.com/eligrey/canvas-toBlob.js/master/canvas-toBlob.js"
MINI="https://raw.githubusercontent.com/Chalarangelo/mini.css/v3.0.1/dist/mini-default.min.css"

echo "Fetching BrowserFS"
wget -nc -nv -O browserfs.min.js $BFS

echo "Fetching BrowserFS ZipFS"
wget -nc -nv -O browserfs-zipfs-extras.js $ZFS

echo "Fetching FileSaver"
wget -nc -nv -O FileSaver.min.js $SAVE

echo "Fetching canvas-toBlob"
wget -nc -nv -O canvas-toBlob.js $CTB

echo "Fetching mini.css"
wget -nc -nv -O mini.min.css $MINI
