## Installation on MacOS
```
npm i
./node_modules/.bin/electron-rebuild
```

- The reason for splitting up the operating systems is that the typemoji feature works only on macos.
- The typemoji feature is implemented with RobotJS. For some reason, this doesn't allow installation on windows and linux

- To get electron-rebuild:
```
npm i
npm i -D electron-rebuild
rm package-lock.json
rm -rf node_modules
npm i
./node_modules/.bin/electron-rebuild
```

## Windows / Linux

From `app/windowsNlinux`:

```
npm install
npm start
```

### Build Windows NSIS Setup.exe

```
npm run dist
```

Output: `dist/Geniemoji-Setup-<version>.exe`

### Portable packages (optional)

```
npm run pack-win32-x64
npm run pack-linux-x64
```
