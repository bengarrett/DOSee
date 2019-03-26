#!/usr/bin/env powershell

$private:bfs = "https://github.com/jvilk/BrowserFS/releases/download/v1.4.3/browserfs.min.js"
$private:zfs = "https://github.com/jvilk/browserfs-zipfs-extras/releases/download/v1.0.1/browserfs-zipfs-extras.js"
$private:full = "https://raw.githubusercontent.com/sindresorhus/screenfull.js/v3.3.3/dist/screenfull.min.js"
$private:save = "https://raw.githubusercontent.com/eligrey/FileSaver.js/master/dist/FileSaver.min.js"
$private:ctb = "https://raw.githubusercontent.com/eligrey/canvas-toBlob.js/master/canvas-toBlob.js"
$private:mini = "https://raw.githubusercontent.com/Chalarangelo/mini.css/v3.0.1/dist/mini-default.min.css"

# is nothing configured in Powershell to use sane defaults?
# allow the use of TLS1.2 (https://stackoverflow.com/questions/41618766/powershell-invoke-webrequest-fails-with-ssl-tls-secure-channel)
[Net.ServicePointManager]::SecurityProtocol = "tls12, tls11, tls"
# Improve download performance (https://ss64.com/ps/invoke-webrequest.html)
$ProgressPreference = 'SilentlyContinue'
# working directory
$dir = Split-Path $MyInvocation.MyCommand.Path

Write-Host "Fetching BrowserFS"
Invoke-WebRequest -Uri $bfs -OutFile $dir\browserfs.min.js

Write-Host "Fetching BrowserFS ZipFS"
Invoke-WebRequest -Uri $zfs -OutFile $dir\browserfs-zipfs-extras.js

Write-Host "Fetching screenfull"
Invoke-WebRequest -Uri $full -OutFile $dir\screenfull.min.js

Write-Host "Fetching FileSaver"
Invoke-WebRequest -Uri $save -OutFile $dir\FileSaver.min.js

Write-Host "Fetching canvas-toBlob"
Invoke-WebRequest -Uri $ctb -OutFile $dir\canvas-toBlob.js

Write-Host "Fetching mini.css"
Invoke-WebRequest -Uri $mini -OutFile $dir\mini.min.css