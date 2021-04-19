// Modules to control application life and create native browser window
const {
    app,
    BrowserWindow,
    Tray,
    globalShortcut
} = require('electron')

const path = require('path')

let tray

function createWindow() {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 350,
        height: 450,
        resizable: false,
        frame: false,
        show: false
    })

    mainWindow.loadFile('index.html')

    if (app.dock) {
        app.dock.hide()
    }

// To get different icons depending on the platform,first comment the new Tray line below, then do this:
    // const iconName = process.platform === win32 ? 'windowsIcon.png' : 'macIcon.png'
    // const iconPath = `assets/${iconName}`
    // new Tray(iconPath)
// Also, if the menubar is in dark mode, we need an inverted icon like this:
    // if (process.platform === 'win32') return 'icon-light.ico'
    // if (systemPreferences.isDarkMode()
    // return 'icon-dark.png'
    tray = new Tray('assets/TrayIcons/iconTemplate.png')

    // tray onClick event
    tray.on('click', () => {
        // If the window is visible and the tray icon is clicked, it should become hidden and vice versa
        if (mainWindow.isVisible()) {
            mainWindow.hide()
        } else {
            mainWindow.show()
        }
    })

    // This is for the tiny popup that shows up on hovering the icon
    tray.setToolTip('Cadbury')

    // This is when the window is not in focus
    mainWindow.on('blur', () => {
        mainWindow.hide()
    })

    // This is a global shortcut to activate Cadbury with hotkey(s)
    globalShortcut.register('Alt+Space', () => {
        // console.log('Electron loves global shortcuts!')
        if (mainWindow.isVisible()) {
            mainWindow.hide()
        } else {
            mainWindow.show()
        }
    })

}


// From boilerplate code
app.whenReady().then(() => {
    createWindow()
})

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})