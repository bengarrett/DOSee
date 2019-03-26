# DOSee

## An MS-DOS emulator for the web.

DOSee is a front-end for an MS-DOS emulation ecosystem created by many amazing people over many years.

DOSee itself is a fork of [The Emularity](https://github.com/db48x/emularity) project created by the Internet Archive.

[EM-DOSBox](https://github.com/dreamlayers/em-dosbox/) is a JavaScript port of [DOSBox](https://www.dosbox.com), the world's most popular MS-DOS emulator in use today.

![DOSee preview](images/preview.png)

### What's new

[Changes and updates can be found here](CHANGES.md)

### Dependencies and requirements

- A web browser that supports JavaScript ES6 (ECMAScript 2015).
- A local web server or a Docker installation, instructions are below.

### Installation

Clone DOSee.

```
git clone https://github.com/bengarrett/DOSee.git
```

Download dependencies on **macOS** or **Linux**.

```
chmod +x libs/install.sh
./libs/install.sh
```

Download dependencies on **Windows** or **PowerShell Core**

```
.\libs\install.ps1
```

**DOSee has to be served via a HTTP server, it can not be run using the browser `file:///` protocol.**

#### Python 3

```
cd DOSee
python3 -m http.server 5550
```

Point a web browser to http://localhost:5550

#### Node.js

```
npm install http-server -g
cd DOSee
http-server -p 5550
```

Point a web browser to http://localhost:5550

#### Docker

Requirement:

- Docker engine: 17.04.0+
- docker-compose: 3.2

Run

```
cd DOSee
docker-compose up -d
```

Point a web browser to http://localhost:5550

Stop

```
cd DOSee
docker-compose down
```

### Usage

You can easily customise DOSee to load your own MS-DOS programs using HTML5 `<meta>` elements. The [index.html](index.html) file is the entry point which contains 6 meta elements specifically used by DOSee for providing emulation information and customisations.

```html
<!-- DOSee initialisation options -->
<meta
  name="dosee:gamefilepath"
  content="dos_programs/program_4/agi_demo_pack_1.zip"
/>
<meta name="dosee:startexe" content="sierra.com" />

<meta name="dosee:capname" content="screenshot.png" />
<meta name="dosee:utils" content="false" />
<meta name="dosee:gusaudio" content="false" />
<meta name="dosee:resolution" content="640, 480" />
```

#### Required

#### `<meta name="dosee:gamefilepath">`

DOSee can use compatible ZIP file archives as an emulated hard disk drive. Any ZIP file archive provided by _dosee:gamefilepath_ is mountable by the emulator as the MS-DOS drive `C:`. This drive will be accessible to all the usual MS-DOS commands such as `dir C:` and any included MS-DOS programs are able to be launch.

The content must be a relative path to the web root and needs to point to a compatible ZIP file archive.

#### `<meta name="dosee:startexe">`

The filename of the MS-DOS program DOSee should launch. The program needs to exist in the ZIP file archive provided to _dosee:gamefilepath_.

MS-DOS programs usually use the following file extensions: `.exe` `.com` `.bat`

If the content is left blank or the filename doesn't exist in the archive, DOSee will launch into an MS-DOS `C:` prompt.

#### Optional

#### `<meta name="dosee:capname">`

The filename used by the capture feature when capturing and saving emulator screenshots. The images use the PNG format, and so the name should include a `.png` file extension.

#### `<meta name="dosee:utils">`

When set to `true` it tells DOSee to mount a collection of MS-DOS utilities and tools that are accessible from the `U:` drive.

#### Placeholders

#### `<meta name="dosee:gusaudio">`

When set to `true` it tells DOSee to mount a collection of Gravis Ultrasound audio drivers and tools that are accessible from the `G:` drive. These drivers are always loaded by DOSee whenever the Gravis Ultrasound audio option is selected so this should always be left to `false`.

#### `<meta name="dosee:resolution">`

This should adjust the pixel width and height of the EM-DOSBox emulator but it seems to have no noticeable effect.

#### Sample programs

There are three additional sample programs included in this repository that can be run by DOSee. In the [index.html](index.html) replace these `<meta>` elements.

```html
<!-- DOSee initialisation options -->
<meta
  name="dosee:gamefilepath"
  content="dos_programs/program_4/agi_demo_pack_1.zip"
/>
<meta name="dosee:startexe" content="sierra.com" />
```

Sample program 1 (fastest, VGA, Gravis Ultrasound)

```html
<meta name="dosee:gamefilepath" content="dos_programs/program_1/df2intro.zip" />
<meta name="dosee:startexe" content="DF2.EXE" />
```

Sample program 2 (fastest, VGA, Gravis Ultrasound)

```html
<meta name="dosee:gamefilepath" content="dos_programs/program_2/df2.zip" />
<meta name="dosee:startexe" content="df2.exe" />
```

Sample program 3 (fastest, VGA, Sound Blaster 16)

```html
<meta name="dosee:gamefilepath" content="dos_programs/program_3/hyb605.zip" />
<meta name="dosee:startexe" content="hyb605.exe" />
```

#### Add your own program example

Create a new directory. For your implementation, there is no need to follow this `dos_programs/` directory naming structure.

```
cd DOSee
mkdir -p dos_programs/program_5
```

Download the Space Quest 3 non-interactive demo.

```
wget -O dos_programs/program_5/sq3-demo.zip https://www.scummvm.org/frs/demos/sci/sq3-dos-ni-demo-en.zip
```

Update the DOSee [index.html](index.html) to launch the demo and enjoy the confusing mess that was the MS-DOS era of gaming.

```html
<!-- DOSee initialisation options -->
<meta name="dosee:gamefilepath" content="dos_programs/program_5/sq3-demo.zip" />
<meta name="dosee:startexe" content="SQ3DEMO.BAT" />
```
