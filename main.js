const electron = require('electron'),
    app = electron.app,
    BrowserWindow = electron.BrowserWindow,
    ipcMain = electron.ipcMain,
    globalShortcut = electron.globalShortcut,
    path = require('path'),
    url = require('url');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 600,
        height: 130,
        frame: false, //无边框
        transparent: true, //透明
        show: false, //默认不显示
        hasShadow: false //去除默认阴影
    });

    //渲染进程完成时才显示窗口
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }))

    //打开开发者工具
    // mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        mainWindow = null;
    });

    ipcMain.on('keydown', (event, arg) => {
        globalShortcut.register('CommandOrControl+v', () => {
            event.sender.send('paste', 'paste');
        });
        globalShortcut.register('CommandOrControl+a', () => {
            event.sender.send('paste', 'selectAll');
        });
    })
};

app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    };
});


//关闭窗口
ipcMain.on('window-close', () => {
    app.quit();
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    };
});