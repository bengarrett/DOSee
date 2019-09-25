# DOSee

![GitHub](https://img.shields.io/github/license/bengarrett/dosee?style=flat-square)
&nbsp;
![GitHub package.json version](https://img.shields.io/github/package-json/v/bengarrett/dosee?style=flat-square)
![GitHub last commit](https://img.shields.io/github/last-commit/bengarrett/dosee?style=flat-square)
&nbsp;
![GitHub repo size](https://img.shields.io/github/repo-size/bengarrett/dosee?style=flat-square)

#### [If you enjoy DOSee, consider buying me a cup of coffee?](https://www.buymeacoffee.com/4rtEGvUIY)

## An MS-DOS emulator for the web.

DOSee is a front-end for an [MS-DOS](https://en.wikipedia.org/wiki/MS-DOS) emulation ecosystem to use on the web. The text-based MS-DOS was the dominant personal computer platform for much of the 1980s up until the mid-1990s before being superseded by Microsoft Windows. Emulating this platform allows the running of tens of thousands of games, demos and applications from this era to run on a web browser both online or offline as a desktop web-app!

DOSee is only a user interface and installation process for an incredible emulation ecosystem created by many amazing people over many years. DOSee itself is a fork of [The Emularity](https://github.com/db48x/emularity) project created by the Internet Archive. [EM-DOSBox](https://github.com/dreamlayers/em-dosbox/) the core of this emulation is a JavaScript port of [DOSBox](https://www.dosbox.com), the world's most popular MS-DOS emulator.

![DOSee preview](src/images/preview.png)

### What's new

[Changes and updates can be found in CHANGES.md](CHANGES.md)

### Requirements

- A web browser that supports JavaScript ES6 (ECMAScript 2015).
  Current Firefox, Chrome, Brave, Edge or Safari will work fine.
- A physical keyboard, as MS-DOS is a text-based operating system.
- [Node.js](https://nodejs.org) with [npm](https://www.npmjs.com/get-npm) and [npx](https://www.npmjs.com/package/npx).

_DOSee has to be served over a HTTP server, it can not be run using the browser `file:///` protocol._

### Instructions, **download and build**

DOSee requires building before it is ready to serve to a web browser.

Clone DOSee.

```
git clone https://github.com/bengarrett/DOSee.git
```

Install the dependencies and build DOSee.

`npm` is the package manager for node.js and is included in that environment. [It's available for all major platforms](https://nodejs.org/en/download/).

```sh
cd DOSee
npm install
```

**If in the future, any edits are made by you to the source files in `src/`. You will need to run this build command.**

```
npm run install
```

### Server instruction, **npm**

Serve the `build` directory over port _5550_.

```
npm run serve
```

Point a web browser to http://localhost:5550

### Server instruction, **Docker**

Requirements:

- Docker engine: 17.04.0+
- docker-compose: 3.2

Run the DOSee container.

```
docker-compose up
```

Point a web browser to http://localhost:5550

### Quick instructions, **Yarn**

_Yarn usage requires both `npm` and `npx` to be installed_

```sh
git clone https://github.com/bengarrett/DOSee.git
cd DOSee
yarn
yarn run serve
```

Point a web browser to http://localhost:5550

### Usage & customisations

[Can be found in USAGE.md](USAGE.md)

### License

1. DOsee is released under GPL-3.0.
2. Em-DOSBox located in `src/emulator` is released under GPL-2.0.
3. `src/disk_drives` and `src/dos_programs` contain non-free software binaries that are included for convenience.

### Similar projects

- [js-dos](https://github.com/caiiiycuk/js-dos) _The best API for running dos programs in browser_
