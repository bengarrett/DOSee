# DOSee

## Changes and updates

### v1.13

- Now will read and use `<meta data="dosee:filename">` element.

### v1.11

- Added a PowerShell install script for Windows (and PowerShell Core) users.
- Replaced `doseeVersion` string with a `version` Map() object.
- Replaced the use of the outdated and broken _screenfull_ library with the [Fullscreen API](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API).
- Fixed missing dependencies false-positives.
- _doseeTabs_ links now anchor back to `<header id="doseeTabs">`

### v1.10

- Initial public release.
