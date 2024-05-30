# DOSee

![GitHub](https://img.shields.io/github/license/bengarrett/dosee?style=flat-square)
&nbsp;
![GitHub package.json version](https://img.shields.io/github/package-json/v/bengarrett/dosee?style=flat-square)
![GitHub last commit](https://img.shields.io/github/last-commit/bengarrett/dosee?style=flat-square)
&nbsp;
![GitHub repo size](https://img.shields.io/github/repo-size/bengarrett/dosee?style=flat-square)

#### [If you enjoy DOSee, consider buying me a cup of coffee?](https://www.buymeacoffee.com/4rtEGvUIY)

## An MS-DOS emulator for the web.

DOSee is a front-end for an [MS-DOS](https://en.wikipedia.org/wiki/MS-DOS) emulation ecosystem to use on the web. The text-based MS-DOS was the dominant personal computer platform for much of the 1980s. Up until the mid-1990s before being superseded by Microsoft Windows. Emulating this platform allows tens of thousands of games, demos and applications from this era to run on a web browser both online or offline as a desktop web-app!

DOSee is only a user interface and installation process for an incredible emulation ecosystem. Many remarkable people created it over many years. DOSee itself is a fork of [The Emularity](https://github.com/db48x/emularity) project started by the Internet Archive. [EM-DOSBox](https://github.com/dreamlayers/em-dosbox/), the core of this emulation, is a JavaScript port of [DOSBox](https://www.dosbox.com), the world's most popular MS-DOS emulator.

![DOSee preview](../src/images/preview.png)

### What's new

[Updates are in CHANGES](CHANGES.md)

### Requirements

- A web browser that supports service workers.<br>
  Current Firefox, Chrome, Edge, or Safari will work fine.
- A physical keyboard, as MS-DOS is a text-based operating system.
- [Node.js](https://nodejs.org) or [Docker](https://www.docker.com/get-started)

**DOSee runs over an HTTP server**, and it can not function over the `file:///` browser protocol.

### Instructions, _download, build and serve_

DOSee requires a build before it can serve to a web browser.

```bash
# clone DOSee
git clone https://github.com/bengarrett/DOSee.git
cd DOSee

 # install dependencies & build
npm install # (or equivalent in another package manager)

# serve DOSee over port 8086
npm run serve
```

Point a web browser to http://localhost:8086

### Docker instructions

There is a [DOSee repository at Docker Hub](https://hub.docker.com/repository/docker/bengarrett/dosee), or you can build locally using these instructions.

```bash
# clone DOSee
git clone https://github.com/bengarrett/DOSee.git
cd DOSee

# run the container (tap Ctrl-C to exit)
docker compose up
```

Point a web browser to http://localhost:8086

```bash
# alternative manual build and run
docker build -t dosee .
docker run --name dosee_app -i -p 8086:80 dosee

# clean up and remove
docker container rm dosee_app
docker image rm dosee
```

### Usage & customisations

[Are in the USAGE document](USAGE.md)

### Editing the source JS or HTML

If you edit the source files in `src/` you will need to rebuild the application.

```bash
# change to the repo directory
cd DOSee

# re-build DOSee using your edits
npm run install

# serve the modified DOSee over port 8086
npm run serve
```

Point a web browser to http://localhost:8086

Due to the PWA offline feature, web browsers need to unregister the service workers to reflect any changes to the application code. There is a red _Update DOSee and the service worker_ button on the index.html example that will do this and then reload the browser window. The eventListener code for this button can be found in the `src/js/dosee-sw.js` file.

### License

1. DOSee is under a GPL-3.0 license.
2. Em-DOSBox located in `src/emulator` is under GPL-2.0 license.
3. `src/disk_drives` and `src/dos_programs` contain non-free software binaries for your convenience.

### Similar projects

- [js-dos](https://github.com/caiiiycuk/js-dos) _The best API for running dos programs in a browser_
