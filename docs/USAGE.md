# DOSee

## Usage & customisations

It is easy to customise DOSee to load other MS-DOS programs by using HTML5 `<meta>` elements. An `index.html` file is an identifier which contains nine meta elements used by DOSee for handling emulation information and customisation.

```html
<!-- DOSee initialisation options -->
<meta
  name="dosee:zip:path"
  content="dos_programs/program_4/agi_demo_pack_1.zip"
/>
<meta name="dosee:run:filename" content="sierra.com" />
<meta name="dosee:capture:filename" content="screenshot.png" />
<meta name="dosee:utilities" content="false" />
<meta name="dosee:width:height" content="640,480" />
<meta name="dosee:speed" content="auto" />
<meta name="dosee:graphic" content="tandy" />
<meta name="dosee:audio" content="none" />
<meta name="dosee:audio:gus" content="false" />
```

## Required

### `<meta name="dosee:zip:path">`

DOSee uses ZIP file archives to simulate a hard disk drive. Any ZIP file provided to _dosee:zip:path_ the emulator will mount path as MS-DOS drive `C:`. The `C:` drive will be accessible to all DOS commands such as `dir C:` and any included DOS programs available to run.

The meta _content_ attribute must be a relative path from the webroot and must point to a ZIP file archive.

✓

```html
<meta name="dosee:zip:path" content="dos_programs/example/dosgame.zip" />
```

✗ Invalid absolute path in the _content_ attribute

```html
<meta
  name="dosee:zip:path"
  content="/home/me/DOSee/dos_programs/example/dosgame.zip"
/>
```

---

### `<meta name="dosee:run:filename">`

The filename of the MS-DOS program DOSee should launch. The program file needs to exist in the ZIP archive provided to _dosee:zip:path_.

DOS usually uses the following file extensions to identify a program: `.exe` `.com` `.bat`. Other than these, there is no standard file naming convention to identify which file should launch a piece of DOS software.

If the content is left blank or the filename doesn't exist in the archive, DOSee will launch into a DOS `C:` prompt.

✓

```html
<meta name="dosee:run:filename" content="game.exe" />
```

## Optional

### `<meta name="dosee:capture:filename">`

The filename used by the capture tool to save emulator screenshots. The PNG images should include the `.png` file extension.

✓

```html
<meta name="dosee:capture:filename" content="game.png" />
```

✗ An invalid filename that's missing the file extension.

```html
<meta name="dosee:capture:filename" content="game" />
```

---

### `<meta name="dosee:utilities">`

When set to `true`, it tells DOSee to mount a collection of MS-DOS utilities and tools accessible from the `U:` drive. The default option is false.

✓

```html
<meta name="dosee:utilities" content="true" />
```

✓

```html
<meta name="dosee:utilities" content="false" />
```

---

### `<meta name="dosee:width:height">`

Configures the initial pixel width and height of the emulation loading screen and canvas. The canvas may readjust itself after the emulator runs depending on the graphics hardware selection, scale options and aspect correction settings. The default canvas and screen size is 640px x 480px.

✓

```html
<meta name="dosee:width:height" content="640,400" />
```

✗ Invalid width and length values.

```html
<meta name="dosee:width:height" content="640px,400px" />
```

---

### `<meta name="dosee:speed" content="auto" />`

The default and initial selection for the **Speed and CPU** hardware. Possible values are:

- `auto` **automatic** (default)
- `8086` **slow (8086)** The first era of PCs using real address mode.
- `386` **medium (80386)** The third generation of PC CPUs using protected mode.
- `max` **faster (80486)** Unlocked, runs the emulator at maximum speed permitted by the browser.

<small>DOSBox `core=dynamic` is not supported by em-dosbox so there is no Pentium emulation.</small>

✓

```html
<meta name="dosee:speed" content="auto" />
```

---

### `<meta name="dosee:graphic" content="tandy" />`

The default and initial selection for the **Graphic adapter** hardware. Possible values are:

- `svga`<br>**SuperVGA** Emulates an [S3 Trio64](https://en.wikipedia.org/wiki/S3_Trio) supporting much higher resolutions than VGA.
- `vga` (default)<br>**VGA** Supports 256 colors at 320x200 resolution or 16 colors at 640x480.
- `ega`<br>**EGA** Supports a limited selection of 16 colors up to 640x350 resolution.
- `tandy`<br>**Tandy** Emulates the Tandy 1000 series or the IBM PCjr, which uses a variant of CGA that has 16 colors and enhanced audio.
- `cga`<br>**CGA** Generally offers 4 colors at 320×200 resolution or monochrome at 640x200.
- `herc`<br>**Hercules** Supports monochrome at 720x348 to improve the legibility of text.

✓

```html
<meta name="dosee:graphic" content="tandy" />
```

---

### `<meta name="dosee:audio" content="none" />`

The default and initial selection for the **Audio addon** hardware. Possible values are:

- `gus`<br>**Gravis Ultrasound** offers high quality 14 channel, 16-bit, 44 KHz digital playback.
- `covox`<br>**Covox** Covox Speech Accelerator is an external audio device and speaker with mono digital playback.
- `sb16`<br>**Sound Blaster 16** Creative Labs Sound Blaster 16 offers stereo, 16-bit, 44 KHz digital playback.
- `sb1`<br>**Sound Blaster 1.0** Creative Labs Sound Blaster v1.0 offers mono, 8-bit, 22 KHz digital playback.
- `none`<br>**none** Do not use any addon audio hardware. Internal PC, PCjr or Tandy 1000 speaker audio will be in use.

✓

```html
<meta name="dosee:audio" content="none" />
```

## Placeholders

#### `<meta name="dosee:audio:gus">`

When set to `true`, it tells DOSee to mount a collection of Gravis Ultrasound audio drivers and tools accessible from the `G:` drive. These drivers are always loaded by DOSee whenever the Gravis Ultrasound audio option is selected. So this should still be left to `false`.

#### Sample programs

There are three additional sample programs included in this repository that you can try out. In the `index.html` update the following `<meta>` elements.

```html
<!-- DOSee initialisation options -->
<meta
  name="dosee:zip:path"
  content="dos_programs/program_4/agi_demo_pack_1.zip"
/>
<meta name="dosee:run:filename" content="sierra.com" />
<meta name="dosee:speed" content="auto" />
<meta name="dosee:graphic" content="tandy" />
<meta name="dosee:audio" content="none" />
```

Sample program 1, Lucasfilm adventure demo

```html
<meta name="dosee:zip:path" content="dos_programs/program_1/loom.zip" />
<meta name="dosee:run:filename" content="SAMPLER.EXE" />
<meta name="dosee:speed" content="386" />
<meta name="dosee:graphic" content="ega" />
<meta name="dosee:audio" content="sb1" />
```

Sample program 2, Verses by Electromotive Force

```html
<meta name="dosee:zip:path" content="dos_programs/program_2/emf_vrs2.zip" />
<meta name="dosee:run:filename" content="VERSES.EXE" />
<meta name="dosee:speed" content="max" />
<meta name="dosee:graphic" content="vga" />
<meta name="dosee:audio" content="gus" />
```

Sample program 3, Intro by Hybrid

```html
<meta name="dosee:zip:path" content="dos_programs/program_3/hyb605.zip" />
<meta name="dosee:run:filename" content="hyb605.exe" />
<meta name="dosee:speed" content="max" />
<meta name="dosee:graphic" content="vga" />
<meta name="dosee:audio" content="sb16" />
```

#### Add new software, an example

Create a new program subdirectory. For your implementation, there is no requirement to follow this `dos_programs/` directory naming structure.

```bash
cd DOSee
mkdir -p dos_programs/program_5
```

Download the [Space Quest 3 non-interactive demo](https://www.scummvm.org/frs/demos/sci/sq3-dos-ni-demo-en.zip) and save it to the new program subdirectory.

```bash
wget -O dos_programs/program_5/sq3-demo.zip https://www.scummvm.org/frs/demos/sci/sq3-dos-ni-demo-en.zip
```

Update the DOSee `index.html` to launch the demo and enjoy the confusing mess that is the MS-DOS era of computer games.

```html
<!-- DOSee initialisation options -->
<meta name="dosee:zip:path" content="dos_programs/program_5/sq3-demo.zip" />
<meta name="dosee:run:filename" content="SQ3DEMO.BAT" />
```

![DOSee preview](../src/images/sq3demo.png)

[back to README](README.md)
