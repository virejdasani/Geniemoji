const {
  app,
  BrowserWindow,
  Tray,
  globalShortcut,
  Menu,
  ipcMain,
} = require("electron");
const { LRUMap } = require("lru_map");

const robot = require("robotjs");

// This is the npm package `open`, it is used here to open all links in an external browser
const open = require("open");

const path = require("path");

const assetsDirectory = path.join(__dirname, "assets");

// JSON list of emojis
const emojis = require("./src/emojis");

let tray = undefined;
let window = undefined;

// Let's preset our LRU Map that we'll use to keep track of recent uses
let lruMap = new LRUMap(10);

// Hide the menu and dev tools (for production build)
Menu.setApplicationMenu(null);

app.on("ready", () => {
  createTray();
  createWindow();
});

// Quit the app when the window is closed
app.on("window-all-closed", () => {
  app.quit();
});

const createTray = () => {
  tray = new Tray(path.join(assetsDirectory, "geniemojiLamp@2x.png"));
  tray.on("right-click", toggleWindow);
  tray.on("double-click", toggleWindow);
  tray.on("click", function (event) {
    toggleWindow();
  });
};

const createWindow = () => {
  window = new BrowserWindow({
    width: 350,
    height: 240,
    show: false,
    frame: false,
    fullscreenable: false,
    resizable: false,
    alwaysOnTop: true,
    webPreferences: {
      backgroundThrottling: false,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // This is so that Geniemoji shows up on all desktops/workspaces
  window.setVisibleOnAllWorkspaces(true);

  // Load index.html
  window.loadURL(`file://${path.join(__dirname, "public/index.html")}`);

  // If 'esc' is pressed, hide the app window
  window.webContents.on("before-input-event", (event, input) => {
    if (input.key === "Escape") {
      hideWindow();
      // event.preventDefault()
    }
  });

  // This opens all links with `target="_blank"` in external browser
  window.webContents.on("new-window", function (event, url) {
    event.preventDefault();
    open(url);
  });

  // Hide the window when it loses focus
  window.on("blur", () => {
    hideWindow();
  });

  // This is a global shortcut to activate Geniemoji with hotkey(s)
  globalShortcut.register("Control+e", () => {
    if (window.isVisible()) {
      hideWindow();
    } else {
      showWindow();
    }
  });
  if (process.platform == "darwin") {
    // Don't show the app in the dock for macOS
    app.dock.hide();
  } else {
    // To hide the app in the dock for windows and linux
    window.setSkipTaskbar(true);
  }
};

// When we get a signal to type an emoji, use RobotJS to type it out
ipcMain.on("typeEmoji", (_event, arg) => {
  hideWindow();
  robot.typeString(arg);
});

// Return filtered and sorted emojis based on a search query
ipcMain.handle("getEmojisForSearchString", (_event, arg) => {
  const recents = Array.from(lruMap.keys());

  // For each emoji in the emojis.js file, this will search
  // through emoji.keywords and emoji.name (from emojis.js) if it contains the word from the user input
  return emojis
    .filter((item) => item.keywords.includes(arg) || item.name.toLowerCase().includes(arg))
    .sort((a, b) => {
      if (lruMap.has(a.char) && !lruMap.has(b.char)) {
        // A is in recently used and B is not
      return -1;
      } else if (!lruMap.has(a.char) && lruMap.has(b.char)) {
        // B is in recently used and A is not
        return 1;
      } else if (!lruMap.has(a.char) && !lruMap.has(b.char)) {
        // Neither A nor B is in recently used
        return a.no - b.no;
      } else {
        // Both A and B are in recently used
        return recents.indexOf(b.char) - recents.indexOf(a.char);
      }
    })
});

// When we get a signal to select an emoji, update our LRU Map
ipcMain.on("selectEmoji", (_event, arg) => {
  lruMap.set(arg, "");
});

const toggleWindow = () => {
  if (window.isVisible()) {
    hideWindow();
  } else {
    showWindow();
  }
};

const showWindow = () => {
  window.show();
};

const hideWindow = () => {
  // This is required because app.hide() is not defined in windows and linux
  if (process.platform == "darwin") {
    // This is so that when reopening the window, the previous state is not remembered
    window.reload();
    // Both of these are needed because they help restore focus back to the previous window
    app.hide();
    window.hide();
  } else {
    // This is so that when reopening the window, the previous state is not remembered
    window.reload();
    // Both of these are needed because they help restore focus back to the previous window
    window.minimize();
    window.hide();
  }
};
