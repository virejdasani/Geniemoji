const { app, BrowserWindow, Tray, globalShortcut, Menu, ipcMain, clipboard } = require("electron");
const { LRUMap } = require("lru_map");
const { execFile } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);

// Create store to save user's recents
const Store = require('electron-store');
const store = new Store();

// This is the npm package `open`, it is used here to open all links in an external browser
const open = require("open");

const path = require("path");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Ignore blur-to-hide while we close + paste into the previous app
let insertingEmoji = false;

const assetsDirectory = path.join(__dirname, "assets");

// JSON list of emojis
const emojis = require("./src/emojis");

let tray = undefined;
let window = undefined;
let shortcutWindow = undefined;
let language = store.get("language", "en");
let viewStyle = store.get("viewStyle", "list");
let textShortcuts = normalizeTextShortcuts(store.get("textShortcuts", []));
let openAtLogin = store.get("openAtLogin", false);

const trayStrings = {
  en: {
    show: "Show Geniemoji",
    languages: "Languages",
    english: "English",
    spanish: "Spanish",
    viewStyle: "View style",
    list: "List",
    grid: "Grid",
    shortcuts: "Shortcuts",
    addShortcut: "Add shortcut…",
    editShortcut: "Edit",
    removeShortcut: "Remove",
    noShortcuts: "No shortcuts yet",
    openAtLogin:
      process.platform === "darwin"
        ? "Start at login"
        : "Start with Windows",
    exit: "Exit",
  },
  es: {
    show: "Mostrar Geniemoji",
    languages: "Idiomas",
    english: "Inglés",
    spanish: "Español",
    viewStyle: "Estilo de vista",
    list: "Lista",
    grid: "Cuadrícula",
    shortcuts: "Atajos",
    addShortcut: "Agregar atajo…",
    editShortcut: "Editar",
    removeShortcut: "Eliminar",
    noShortcuts: "Sin atajos todavía",
    openAtLogin:
      process.platform === "darwin"
        ? "Iniciar al iniciar sesión"
        : "Iniciar con Windows",
    exit: "Salir",
  },
};

function normalizeTextShortcuts(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const normalized = [];
  for (const item of list) {
    if (!item || typeof item.trigger !== "string" || typeof item.value !== "string") {
      continue;
    }
    const trigger = item.trigger.trim();
    const value = item.value;
    if (!trigger || !value.trim()) continue;
    const key = trigger.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push({ trigger, value });
  }
  return normalized.sort((a, b) =>
    a.trigger.localeCompare(b.trigger, undefined, { sensitivity: "base" })
  );
}

function persistTextShortcuts() {
  store.set("textShortcuts", textShortcuts);
  updateTrayMenu();
}

function shortcutToSearchItem(shortcut) {
  return {
    kind: "shortcut",
    no: -1,
    codes: "",
    char: shortcut.value,
    name: shortcut.trigger,
    name_es: shortcut.trigger,
    keywords: shortcut.trigger,
    keywords_es: shortcut.trigger,
  };
}

// Let's fetch our previous LRU Map, or set it
let lruMap;
if (store.has("lruMap")) {
  lruMap = new LRUMap(10, store.get("lruMap").map(it => {
    return [it.key, it.value];
  }));
} else {
  lruMap = new LRUMap(10);
}

// Hide the menu and dev tools
Menu.setApplicationMenu(null)

const applyOpenAtLogin = (enabled) => {
  // Login items are supported on Windows (and macOS); skip elsewhere.
  if (process.platform !== "win32" && process.platform !== "darwin") {
    return;
  }

  const settings = { openAtLogin: !!enabled };

  // When running via `electron .`, also pass the app entry so relaunch works.
  if (!app.isPackaged) {
    settings.path = process.execPath;
    settings.args = [path.resolve(process.argv[1] || ".")];
  }

  app.setLoginItemSettings(settings);
};

const setOpenAtLogin = (enabled) => {
  openAtLogin = !!enabled;
  store.set("openAtLogin", openAtLogin);
  applyOpenAtLogin(openAtLogin);
  updateTrayMenu();
};

app.on("ready", () => {
  // Prefer the OS login-item state if present; otherwise use stored preference.
  if (process.platform === "win32" || process.platform === "darwin") {
    const loginItem = app.getLoginItemSettings();
    if (typeof loginItem.openAtLogin === "boolean") {
      openAtLogin = loginItem.openAtLogin;
      store.set("openAtLogin", openAtLogin);
    } else {
      applyOpenAtLogin(openAtLogin);
    }
  }

  createTray();
  createWindow();
});

// Quit the app when the window is closed
app.on("window-all-closed", () => {
  app.quit();
});

const applyWindowSizeForView = () => {
  if (!window || window.isDestroyed()) return;
  if (viewStyle === "grid") {
    window.setSize(350, 420);
  } else {
    window.setSize(350, 240);
  }
};

const setLanguage = (nextLanguage) => {
  if (nextLanguage !== "en" && nextLanguage !== "es") return;
  language = nextLanguage;
  store.set("language", language);
  updateTrayMenu();
  if (window && !window.isDestroyed()) {
    window.webContents.send("language-changed", language);
  }
};

const setViewStyle = (nextViewStyle) => {
  if (nextViewStyle !== "list" && nextViewStyle !== "grid") return;
  viewStyle = nextViewStyle;
  store.set("viewStyle", viewStyle);
  updateTrayMenu();
  applyWindowSizeForView();
  if (window && !window.isDestroyed()) {
    window.webContents.send("view-style-changed", viewStyle);
  }
};

const openShortcutWindow = (triggerToEdit = null) => {
  if (shortcutWindow && !shortcutWindow.isDestroyed()) {
    shortcutWindow.focus();
    return;
  }

  shortcutWindow = new BrowserWindow({
    width: 360,
    height: 320,
    show: false,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    alwaysOnTop: true,
    title: "Geniemoji",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  const query = triggerToEdit
    ? `?trigger=${encodeURIComponent(triggerToEdit)}`
    : "";
  shortcutWindow.loadURL(
    `file://${path.join(__dirname, "public/shortcut.html")}${query}`
  );
  shortcutWindow.setMenu(null);
  shortcutWindow.once("ready-to-show", () => {
    if (shortcutWindow && !shortcutWindow.isDestroyed()) {
      shortcutWindow.show();
    }
  });
  shortcutWindow.on("closed", () => {
    shortcutWindow = undefined;
  });
};

const closeShortcutWindow = () => {
  if (shortcutWindow && !shortcutWindow.isDestroyed()) {
    shortcutWindow.close();
  }
};

const updateTrayMenu = () => {
  if (!tray) return;
  const t = trayStrings[language] || trayStrings.en;

  const shortcutItems =
    textShortcuts.length === 0
      ? [{ label: t.noShortcuts, enabled: false }]
      : textShortcuts.map((shortcut) => {
          const preview =
            shortcut.value.length > 28
              ? `${shortcut.value.slice(0, 28)}…`
              : shortcut.value;
          return {
            label: `${shortcut.trigger} → ${preview}`,
            submenu: [
              {
                label: t.editShortcut,
                click: () => openShortcutWindow(shortcut.trigger),
              },
              {
                label: t.removeShortcut,
                click: () => {
                  textShortcuts = textShortcuts.filter(
                    (item) =>
                      item.trigger.toLowerCase() !==
                      shortcut.trigger.toLowerCase()
                  );
                  persistTextShortcuts();
                },
              },
            ],
          };
        });

  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: t.show,
        click: () => showWindow(),
      },
      {
        label: t.languages,
        submenu: [
          {
            label: t.english,
            type: "radio",
            checked: language === "en",
            click: () => setLanguage("en"),
          },
          {
            label: t.spanish,
            type: "radio",
            checked: language === "es",
            click: () => setLanguage("es"),
          },
        ],
      },
      {
        label: t.viewStyle,
        submenu: [
          {
            label: t.list,
            type: "radio",
            checked: viewStyle === "list",
            click: () => setViewStyle("list"),
          },
          {
            label: t.grid,
            type: "radio",
            checked: viewStyle === "grid",
            click: () => setViewStyle("grid"),
          },
        ],
      },
      {
        label: t.shortcuts,
        submenu: [
          {
            label: t.addShortcut,
            click: () => openShortcutWindow(),
          },
          { type: "separator" },
          ...shortcutItems,
        ],
      },
      ...(process.platform === "win32" || process.platform === "darwin"
        ? [
            {
              label: t.openAtLogin,
              type: "checkbox",
              checked: openAtLogin,
              click: (menuItem) => setOpenAtLogin(menuItem.checked),
            },
          ]
        : []),
      { type: "separator" },
      {
        label: t.exit,
        click: () => {
          globalShortcut.unregisterAll();
          app.quit();
        },
      },
    ])
  );
};

const createTray = () => {
  tray = new Tray(path.join(assetsDirectory, "geniemojiLamp@2x.png"));
  tray.setToolTip("Geniemoji");
  updateTrayMenu();
  tray.on("double-click", toggleWindow);
  tray.on("click", () => {
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
  applyWindowSizeForView();

  // If 'esc' is pressed, hide the app window
  window.webContents.on("before-input-event", (event, input) => {
    if (input.key === "Escape") {
      hideWindow();
    }
  });

  // This opens all links with `target="_blank"` in external browser
  window.webContents.on("new-window", function (event, url) {
    event.preventDefault();
    open(url);
  });

  // Hide the window when it loses focus
  window.on("blur", () => {
    if (insertingEmoji) return;
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

// Fold accents so Spanish queries like "corazon" match "corazón"
const fold = (s) =>
  s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");

const emojiMatchesQuery = (item, query) => {
  const q = fold(query);
  return (
    fold(item.keywords).includes(q) ||
    fold(item.name).includes(q) ||
    (item.keywords_es && fold(item.keywords_es).includes(q)) ||
    (item.name_es && fold(item.name_es).includes(q)) ||
    (item.alias && fold(item.alias).includes(q))
  );
};

const shortcutMatchesQuery = (shortcut, query) => {
  const q = fold(query);
  if (!q) return false;
  return (
    fold(shortcut.trigger).includes(q) || fold(shortcut.value).includes(q)
  );
};

// Return filtered and sorted emojis (plus text shortcuts) based on a search query
ipcMain.handle("getEmojisForSearchString", (_event, arg) => {
  const recents = Array.from(lruMap.keys());
  const query = String(arg || "").trim();

  const matchedShortcuts = textShortcuts
    .filter((shortcut) => shortcutMatchesQuery(shortcut, query))
    .sort((a, b) => {
      const q = fold(query);
      const aExact = fold(a.trigger) === q ? 0 : 1;
      const bExact = fold(b.trigger) === q ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
      return a.trigger.localeCompare(b.trigger, undefined, {
        sensitivity: "base",
      });
    })
    .map(shortcutToSearchItem);

  // Search English and Spanish names/keywords
  const matchedEmojis = emojis
    .filter((item) => emojiMatchesQuery(item, query))
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
    });

  // Shortcuts first so custom expansions win over emoji name matches
  return matchedShortcuts.concat(matchedEmojis);
});

ipcMain.handle("getTextShortcuts", () => textShortcuts);

ipcMain.on("saveTextShortcut", (_event, payload) => {
  if (!payload || typeof payload !== "object") return;

  const trigger =
    typeof payload.trigger === "string" ? payload.trigger.trim() : "";
  const value = typeof payload.value === "string" ? payload.value : "";
  const previousTrigger =
    typeof payload.previousTrigger === "string"
      ? payload.previousTrigger.trim()
      : "";

  if (!trigger || !value.trim()) return;

  const nextKey = trigger.toLowerCase();
  const previousKey = previousTrigger.toLowerCase();

  textShortcuts = textShortcuts.filter((item) => {
    const key = item.trigger.toLowerCase();
    if (previousKey && key === previousKey) return false;
    if (key === nextKey) return false;
    return true;
  });
  textShortcuts.push({ trigger, value });
  textShortcuts = normalizeTextShortcuts(textShortcuts);
  persistTextShortcuts();
  closeShortcutWindow();
});

ipcMain.on("closeShortcutWindow", () => {
  closeShortcutWindow();
});

const pasteClipboard = async () => {
  if (process.platform === "win32") {
    await execFileAsync(
      "powershell.exe",
      [
        "-NoProfile",
        "-STA",
        "-Command",
        "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('^v')",
      ],
      { windowsHide: true }
    );
    return;
  }

  if (process.platform === "darwin") {
    await execFileAsync("osascript", [
      "-e",
      'tell application "System Events" to keystroke "v" using command down',
    ]);
    return;
  }

  await execFileAsync("xdotool", ["key", "ctrl+v"]);
};

// Copy emoji, close Geniemoji (focus returns to previous app), then paste
ipcMain.on("typeEmoji", async (_event, arg) => {
  if (!window || window.isDestroyed()) return;

  insertingEmoji = true;
  clipboard.writeText(arg);

  try {
    hideWindow();
    await sleep(100);
    await pasteClipboard();
  } catch (err) {
    console.error("Failed to type emoji:", err);
  } finally {
    insertingEmoji = false;
  }
});

// When we get a signal to select an emoji, update our LRU Map
ipcMain.on("selectEmoji", (_event, arg) => {
  lruMap.set(arg, "");

  // Save our current lruMap's JSON representation to the store
  store.set("lruMap", lruMap.toJSON());
});

ipcMain.handle("getLanguage", () => language);
ipcMain.handle("getViewStyle", () => viewStyle);

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
