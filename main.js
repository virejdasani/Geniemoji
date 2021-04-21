// https://github.com/kevinsawicki/tray-example/

const {
    app,
    BrowserWindow,
    Tray,
    globalShortcut
} = require('electron')

const path = require('path')

const assetsDirectory = path.join(__dirname, 'assets')

let tray = undefined
let window = undefined

app.on('ready', () => {
    createTray()
    createWindow()
})

// Quit the app when the window is closed
app.on('window-all-closed', () => {
    app.quit()
})

const createTray = () => {
    tray = new Tray(path.join(assetsDirectory, 'sunTemplate.png'))
    tray.on('right-click', toggleWindow)
    tray.on('double-click', toggleWindow)
    tray.on('click', function (event) {
        toggleWindow()

        // Show devtools when command clicked
        if (window.isVisible() && process.defaultApp && event.metaKey) {
            window.openDevTools({
                mode: 'detach'
            })
        }
    })
}

const createWindow = () => {
    window = new BrowserWindow({
        width: 350,
        height: 240,
        show: false,
        frame: false,
        fullscreenable: false,
        resizable: false,
        webPreferences: {
            // Prevents renderer process code from not running when window is
            // hidden
            backgroundThrottling: false
        }
    })
    window.loadURL(`file://${path.join(__dirname, 'public/index.html')}`)

    // Hide the window when it loses focus
    window.on('blur', () => {
        window.hide()
    })

    // This is a global shortcut to activate Geniemoji with hotkey(s)
    globalShortcut.register('Control+e', () => {
        if (window.isVisible()) {
            window.hide()
        } else {
            window.show()
        }
    })
    if (process.platform !== 'win32') {
        // Don't show the app in the dock for macOS
        app.dock.hide()
    } else {
        // To hide the app in the dock for windows
        window.setSkipTaskbar(true)
    }


}

const toggleWindow = () => {
    if (window.isVisible()) {
        window.hide()
    } else {
        showWindow()
    }
}

const showWindow = () => {
    window.show()
    window.focus()
}

// TODO - change file names and change tray icon