// Modules to control application life and create native browser window
const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron')
const path = require('node:path')

const electron = require('electron')
/*获取electron窗体的菜单栏*/
const Menu = electron.Menu
/*隐藏electron创听的菜单栏*/
Menu.setApplicationMenu(null)

let timeWindow;
let mainWindow;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    // frame: false,
  })

  // and load the index.html of the app.
  mainWindow.loadFile('./pages/index/index.html')

  // 快捷键事件
  globalShortcut.register('F11', () => {
    // 切换全屏状态
    if (mainWindow) {
      if (mainWindow.isFullScreen()) {
        mainWindow.setFullScreen(false);
      } else {
        mainWindow.setFullScreen(true);
      }
    }
  });

  mainWindow.on('closed', () => {
    if (timeWindow) {
      timeWindow.close()
    }
    mainWindow = null;
    // app.quit();
  });

  // ICPMAIN->RENDER COMMUNICATION
  // globalShortcut.register('Space', () => {
  //   mainWindow.webContents.send('Space_key');
  // });

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}


function createtimeWindow() {
  timeWindow = new BrowserWindow({
    width: 150,
    height: 80,
    transparent: true, // 设置窗口透明
    frame: false,      // 去掉窗口边框
    alwaysOnTop: true, // 窗口置顶
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  timeWindow.loadFile('./pages/page1/display.html'); // 加载歌词页面
  timeWindow.on('closed', () => {
    timeWindow = null;
  });

  // timeWindow.webContents.openDevTools()

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  globalShortcut.unregisterAll();
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// 显示窗口
ipcMain.on('display', (event) => {
  if (timeWindow == null) {
    createtimeWindow();
  }
})

// 更新时间
ipcMain.on('update-time', (event, time) => {
  if (timeWindow) {
    // console.log(time);
    // 发送给另一个渲染进程
    timeWindow.webContents.send('settime', time);
  }
})