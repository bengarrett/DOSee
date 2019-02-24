# DOSee

DOSee - a MS-DOS emulator for the web.

### Dependencies and requirements

- A web browser that supports JavaScript ES6 (ECMAScript 2015).
- A local web server or a Docker installation.

### Installation

Clone DOSee.

```
git clone https://github.com/bengarrett/DOSee.git
```

Download the libraries and dependencies.

```sh
chmod +x DOSee/libs/wget_libs.sh
./DOSee/libs/wget_libs.sh
```

Change to the current directory and run a HTTP server.

```
cd DOSee
```

__DOSee has to be served via a HTTP server, it can not be run using the browser `file:///` protocol.__

#### Python 3

```
python3 -m http.server 5555
```
Point a web browser to http://localhost:5555

#### Node.js

```
http-server -p 5555
```
Point a web browser to http://localhost:5555

#### Docker

Requirement:
- Docker engine: 17.04.0+
- docker-compose: 3.2

Run

```
docker-compose up -d
```

Point a web browser to http://localhost:5555

Stop

```
docker-compose down
```
