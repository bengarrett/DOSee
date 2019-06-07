# DOSee

## Usage & customisations

It is easy to customise DOSee to load other MS-DOS programs by using HTML5 `<meta>` elements. A [index.html](index.html) file is the identifier which contains 6 meta elements used by DOSee for handling emulation information and customisation.

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

DOSee uses ZIP file archives to simulate a hard disk drive. Any ZIP file provided to _dosee:gamefilepath_ will be mounted by the emulator as MS-DOS drive `C:`. The `C:` drive will be accessible to all DOS commands such as `dir C:` and any included DOS programs available to run.

The meta _content_ attribute must be a relative path from the web root and needs to point to a ZIP file archive.

✓ `<meta name="dosee:gamefilepath" content="dos_programs/example/dosgame.zip" />`

✗ `<meta name="dosee:gamefilepath" content="/home/me/DOSee/dos_programs/example/dosgame.zip" />`

#### `<meta name="dosee:startexe">`

The filename of the MS-DOS program DOSee should launch. The program file needs to exist in the ZIP archive provided to _dosee:gamefilepath_.

DOS usually uses the following file extensions to identify a program: `.exe` `.com` `.bat`. Other than these there is no standard file naming convention to identify which file should be used to launch a piece of DOS software.

If the content is left blank or the filename doesn't exist in the archive, DOSee will launch into an DOS `C:` prompt.

✓ `<meta name="dosee:startexe" content="game.exe" />`

#### Optional

#### `<meta name="dosee:capname">`

The filename used by the capture tool to save emulator screenshots. The PNG images should include the `.png` file extension.

✓ `<meta name="dosee:capname" content="game.png" />`

✗ `<meta name="dosee:capname" content="game" />`

#### `<meta name="dosee:utils">`

When set to `true` it tells DOSee to mount a collection of MS-DOS utilities and tools that are accessible from the `U:` drive.

✓ `<meta name="dosee:utils" content="true" />`

✓ `<meta name="dosee:utils" content="false" />`

#### Placeholders

#### `<meta name="dosee:gusaudio">`

When set to `true` it tells DOSee to mount a collection of Gravis Ultrasound audio drivers and tools that are accessible from the `G:` drive. These drivers are always loaded by DOSee whenever the Gravis Ultrasound audio option is selected so this should always be left to `false`.

#### `<meta name="dosee:resolution">`

This should adjust the pixel width and height of the EM-DOSBox emulator but it seems to have no noticeable effect.

todo: implement using DOSee.resize()

#### Sample programs

There are three additional sample programs included in this repository that you can try out. In the [index.html](index.html) update the following `<meta>` elements.

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

#### Add new software example

Create a new program subdirectory. For your own implementation, there is no requirement to follow this `dos_programs/` directory naming structure.

```
cd DOSee
mkdir -p dos_programs/program_5
```

Download the [Space Quest 3 non-interactive demo](https://www.scummvm.org/frs/demos/sci/sq3-dos-ni-demo-en.zip) and save it to the new program subdirectory.

```
wget -O dos_programs/program_5/sq3-demo.zip https://www.scummvm.org/frs/demos/sci/sq3-dos-ni-demo-en.zip
```

Update the DOSee [index.html](index.html) to launch the demo and enjoy the confusing mess that is the MS-DOS era of computer games.

```html
<!-- DOSee initialisation options -->
<meta name="dosee:gamefilepath" content="dos_programs/program_5/sq3-demo.zip" />
<meta name="dosee:startexe" content="SQ3DEMO.BAT" />
```

![DOSee preview](images/sq3demo.png)

[back to README.md](README.md)
