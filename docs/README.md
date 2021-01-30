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

- A web browser that supports JavaScript ES6 (ECMAScript 2015).<br>
  Current Firefox, Chrome, Edge, Brave or Safari will work fine.
- A physical keyboard, as MS-DOS is a text-based operating system.
- [Node.js](https://nodejs.org) with [yarn](https://yarnpkg.com) or [npm](https://www.npmjs.com).

**DOSee runs over an HTTP server**, and it can not function using the `file:///` browser protocol.

### Instructions, _download, build and serve_

DOSee requires a build before it can serve to a web browser.

```bash
# clone DOSee
git clone https://github.com/bengarrett/DOSee.git
cd DOSee

 # install dependencies & build
yarn # npm install

# serve dosee over port 8086
yarn run serve # npm run serve
```

Point a web browser to http://localhost:8086

### Editing the JS or HTML

If you edit the source files in `src/` you will need to clear the application storage and unregister the service workers.

- In Chrome/Edge bring up the browser Dev Tools in using <kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>J</kbd>.<br>
  Select the Application and Storage tab.<br>
  Check the Application Unregister service workers checkbox.<br>
  Press the Clear site data button.

- In Firefox bring up the browser Developer Tools in using <kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>I</kbd>.<br>
  Select the Application and Service Workers tab.<br>
  Press the Unregister button.

```bash
# re-build
yarn # npm run install
```

### Docker container instructions

```bash
# clone DOSee
git clone https://github.com/bengarrett/DOSee.git
cd DOSee

# build
docker build -t dosee .

# serve dosee over port 8086, press Ctrl-C to exit
docker run --name dosee_app -i -p 8086:80 dosee

# cleanup and remove
docker container rm dosee_app
docker image rm dosee
```

Point a web browser to http://localhost:8086

### Usage & customisations

[Is in USAGE](USAGE.md)

### License

1. DOSee is under a GPL-3.0 license.
2. Em-DOSBox located in `src/emulator` is under GPL-2.0 license.
3. `src/disk_drives` and `src/dos_programs` contain non-free software binaries for your convenience.

### Similar projects

- [js-dos](https://github.com/caiiiycuk/js-dos) _The best API for running dos programs in a browser_
