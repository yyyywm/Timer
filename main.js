// Modules to control application life and create native browser window
const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron')
const path = require('node:path')
const axios = require('axios');
const iot = require('alibabacloud-iot-device-sdk');
const electron = require('electron');
/*获取electron窗体的菜单栏*/
const Menu = electron.Menu
/*隐藏electron创听的菜单栏*/
Menu.setApplicationMenu(null)

var timeWindow;
var mainWindow;
var mqttWin;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      backgroundThrottling: false,
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
  // mainWindow.webContents.openDevTools();
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
      backgroundThrottling: false,
    },
  });

  timeWindow.loadFile('./pages/page1/display.html'); // 加载歌词页面
  timeWindow.on('closed', () => {
    timeWindow = null;
  });

  // timeWindow.webContents.openDevTools()

}

// mqtt配置参数窗口，输入完之后，
function createMqttWindow() {
  mqttWin = new BrowserWindow({
    width: 800,
    height: 600,
    alwaysOnTop: true, // 窗口置顶
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      backgroundThrottling: false,
    },
  });

  mqttWin.loadFile('./pages/mqtt/index.html');
  mqttWin.on('closed', () => {
    mqttWin = null;
  });

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();


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
  } else {
    timeWindow.close();
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

// 打开mqtt配置窗口
ipcMain.on('mqtt-win', (event) => {
  if (mqttWin == null) {
    createMqttWindow();
    // mqttWin.webContents.openDevTools();
  } else {
    mqttWin.close();
  }
})

// 创建mqtt连接
ipcMain.on('mqtt-connect', (event, data) => {
  mqttConnect(data);
})

// MQTT
/// TODO: MQTT部分得重构，用mqtt原始库，不用阿里云SDK
function mqttConnect(data) {
  const device = iot.device({
    productKey: data.productKey,
    deviceName: data.deviceName,
    deviceSecret: data.deviceSecret,
    brokerUrl: data.brokerUrl,
    keepalive: 1200
  })
  // console.log(data);

  device.end();   // 防止二次连接
  device.on('connect', () => {
    // 刚连接的，publish都能报错disconnect
    device.publish('/' + data.productKey + '/' + data.deviceName + '/user/alive', 'Alive!');
    if (mqttWin) {
      mqttWin.webContents.send('mqtt-ready', "mqtt ready!");
    } else {
      // mainWindow.webContents.send('msg', "connect sucessfully!");
    }
  });
  device.on('error', (err) => {
    console.log(err); // 又没断开，报什么错,error太抽象了
    // mainWindow.webContents.send('msg', "connect error!");

  });
  device.on('close', () => {
    console.log("close");
    mainWindow.webContents.send('msg', "connect close!");
  });
  device.on('offline', () => {
    console.log("offline");
    mainWindow.webContents.send('msg', "connect offline!");

  });
  /// TODO: 后面换物模型吧，方便上下协同
  //订阅指定topic
  device.subscribe('/' + data.productKey + '/' + data.deviceName + '/user/get', { qos: 0 });
  // What? I'm alive
  // 每分钟执行一次,发送心跳包
  setInterval(() => {
    device.publish('/' + data.productKey + '/' + data.deviceName + '/user/alive', 'Alive!');
    console.log('This runs every 1 minute');
  }, 60 * 1000); // 60 秒 * 1000 毫秒

  //接收到数据时将topic以及消息打印出来
  device.on('message', (topic, payload) => {
    console.log(topic, payload.toString());
    mainWindow.webContents.send('start', payload.toString());
  });
}


// Axios
ipcMain.on('upload-time', (event, data) => {
  console.log(data);
  postTime(data.url, data.date, data.time);
})

async function postTime(url, date, time) {
  const data = {
    date: date,
    time: time,
  };

  try {
    const response = await axios.post(url, data);
    mainWindow.webContents.send('msg', "upload success!")
  } catch (error) {
    console.log(error)
    mainWindow.webContents.send('msg', "upload error!")
  }
}