## Installation on MacOS
```
npm i
npm i -D electron-rebuild
rm package-lock.json
rm -rf node_modules
npm i
./node_modules/.bin/electron-rebuild
```

- The reason for splitting up the operating systems is that the typemoji feature works only on macos.
- The typemoji feature is implemented with RobotJS. For some reason, this doesn't allow installation on windows and linux
