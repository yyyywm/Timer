/**
 * This file is loaded via the <script> tag in the index.html file and will
 * be executed in the renderer process for that window. No Node.js APIs are
 * available in this process because `nodeIntegration` is turned off and
 * `contextIsolation` is turned on. Use the contextBridge API in `preload.js`
 * to expose Node.js functionality from the main process.
 */
/// TODO: 确定一下每个功能的启动顺序
// mqtt连接成功 
window.ipcRenderer.on('mqtt-ready', (event, data) => {
    console.log(data);
    // alert("connect sucessfully!");
})

// 开启计时
var tmp;
window.ipcRenderer.on('start', (event, data) => {
    // console.log(data);
    data = Number(data);    // 不太行，如果软件动了，硬件乱了
    if (data && tmp != data) {
        tmp = data;
        startPauseTimer();  // 先不解析数据了，直接收到数据就反转
    } else if (data == 0 && tmp != data) {
        startPauseTimer();
        tmp = data;
    }
})

// 消息提示窗口
window.ipcRenderer.on('msg', (event, data) => {
    alert(data);
})

let seconds = 0;
let interval = null;
const LogEnable = false;

function log(msg) {
    if (LogEnable) {
        console.log(msg);
    }
}

// 当页面加载时，尝试从localStorage获取背景图片
window.onload = function () {
    const savedBackground = localStorage.getItem('backgroundImageUrl');
    if (savedBackground) {
        document.body.style.backgroundImage = `url(${savedBackground})`;
    }
};

function setBackground(files) {
    if (files.length > 0) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const backgroundImageUrl = e.target.result;
            document.body.style.backgroundImage = `url(${backgroundImageUrl})`;
            // 保存背景图片URL到localStorage
            localStorage.setItem('backgroundImageUrl', backgroundImageUrl);
        };
        reader.readAsDataURL(files[0]);
    }
}

function updateTimer() {
    let hours = Math.floor(seconds / 3600);
    let minutes = Math.floor((seconds - (hours * 3600)) / 60);
    let secs = seconds % 60;

    hours = hours < 10 ? "0" + hours : hours;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    secs = secs < 10 ? "0" + secs : secs;

    var data = hours + ":" + minutes + ":" + secs;
    document.getElementById("timer").textContent = data;
    updateSend(data);

}

function startPauseTimer() {
    if (interval === null) {
        interval = setInterval(() => {
            seconds++;
            updateTimer();
        }, 1000);
        document.getElementById("startPauseBtn").textContent = "Pause";
    } else {
        clearInterval(interval);
        interval = null;
        document.getElementById("startPauseBtn").textContent = "Start";
    }
    intervalTime();     // 计算时间间隔
}

function resetTimer() {
    clearInterval(interval);
    interval = null;
    seconds = 0;
    updateTimer();
    document.getElementById("startPauseBtn").textContent = "Start";
    oldtime = newtime = 0;      // 重置时间记录
}


// 侧边栏
const toggleButton = document.getElementById('toggleButton');
const sidebar = document.getElementById('sidebar');

function toggleSidebar() {
    sidebar.classList.toggle('open');
    // Update the button text based on the sidebar's open state
    toggleButton.innerHTML = sidebar.classList.contains('open') ? '&times;' : '&#9776;';
}


// 点击事件处理函数
function handleClickOutside(e) {
    // 检查点击事件是否发生在侧边栏或按钮之外
    if (!sidebar.contains(e.target) && e.target !== toggleButton) {
        if (sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
            toggleButton.innerHTML = '&#9776;'; // 更新按钮文本
        }
    }
}

// 为toggleButton添加点击事件监听器
toggleButton.addEventListener('click', toggleSidebar);
// 为整个文档添加点击事件监听器
document.addEventListener('click', handleClickOutside);


document.addEventListener('keydown', (event) => {
    // 禁用F11默认行为
    if (event.key === 'F11') {
        event.preventDefault();
    } else if (event.code === 'Space') {
        // event.preventDefault();
        startPauseTimer();
        log("space event");
    }
    log("keydown:" + event.code);
});

// 歌单弹窗部分
// 弹窗部分内容
var Pmodal = document.getElementById("PlaylistModal");
var Pbtn = document.getElementById("saveIdButton");
var Pspan = document.getElementsByClassName("PlaylistModalclose")[0]; // 第一个弹窗

// 打开弹窗
function openModal() {
    Pmodal.style.display = "block";
}

// 关闭弹窗
Pspan.onclick = function () {
    Pmodal.style.display = "none";
}

// 点击保存按钮时保存ID并关闭弹窗
Pbtn.onclick = function () {
    var idInput = document.getElementById('playlistIdInput');
    var id = idInput.value;
    const regex = /id=(\d+)/;
    const match = id.match(regex);
    log(match[1]);             // 奇怪，解析结果有点问题
    localStorage.setItem('playlistId', match[1]); // 保存ID到localStorage
    Pmodal.style.display = "none";       // 关闭弹窗
    loadMusic();
    // window.location.reload();   不能使用页面整体刷新
}

var Umodal = document.getElementById("urlModal");
var Ubtn = document.getElementById("urlSaveButton");
var Uspan = document.getElementsByClassName("urlModalclose")[0]; // 第一个弹窗

// 打开弹窗
function openUModal() {
    Umodal.style.display = "block";
}

// 关闭弹窗
Uspan.onclick = function () {
    Umodal.style.display = "none";
}

const uploadtime = document.getElementById('uploadTime');

// 左键点击事件
uploadtime.addEventListener('click', (event) => {
    console.log('Left click');
    uploadTime();
});

// 右键点击事件
uploadtime.addEventListener('contextmenu', (event) => {
    event.preventDefault(); // 阻止默认右键菜单
    console.log('Right click');
    openUModal();
    document.getElementById("urlInput").value = localStorage.getItem('url')

});

Ubtn.onclick = function () {
    var idInput = document.getElementById('urlInput').value;
    localStorage.setItem('url',idInput); // 保存ID到localStorage
    Umodal.style.display = "none";       // 关闭弹窗
}

function loadMusic() {
    var container = document.getElementById('music-player');
    const savedId = localStorage.getItem('playlistId');
    if (container) {
        if (savedId) {
            container.innerHTML = ' <meting-js server="netease" type="playlist" id="' + savedId + '" mini="false" list-folded="true">';
        } else {
            container.innerHTML = ' <meting-js server="netease" type="playlist" id="7515376033" mini="false" list-folded="true">';

        }
    }

}

function helpDocs() {
    showLinkInModal('https://www.e6kb.com/wang-yi-yun-yin-le-ge-danid-huo-qu-jiao-cheng.html')
}

// 显示弹窗并加载链接内容
function showLinkInModal(url) {
    document.getElementById('iframeContent').src = url;
    document.getElementById('helpModal').style.display = "block";
    document.getElementById('myModal').style.display = "none";  // closs
}

// 关闭弹窗
function closeModal() {
    document.getElementById('helpModal').style.display = "none";
}

// communication: main->render
// window.spaceEvent.spaceKey(() => {
//     // startPauseTimer();
//     log("pass");
// })

// Record Moder for English reading
function RecordMode() {
    log("recordmode");
    var container = document.getElementById("record-display");
    if (document.getElementById("record-container") == null) {
        container.innerHTML = '<div id="record-container"></div>';
    } else {
        container.removeChild(container.firstChild);
    }
}

let oldtime = 0, newtime = 0;
function intervalTime() {
    // save time
    newtime = seconds;
    var savetime = newtime - oldtime;
    oldtime = newtime;

    let sec = savetime % 60;
    let min = Math.floor(savetime / 60);
    if (savetime) {
        log(document.getElementById("timer").textContent);
        // log("savetime:" + savetime)
        min = min < 10 ? "0" + min : min;
        sec = sec < 10 ? "0" + sec : sec;
        log(min + ":" + sec);
        if (document.getElementById("record-container")) {
            dispalyRecord(min + ":" + sec);
        }
    }
}

function dispalyRecord(text) {
    const container = document.getElementById("record-container");

    const newContent = '<div class="record">' + text + '</div>';
    container.innerHTML += newContent;

    const textContent = document.getElementsByClassName("record");
    container.scrollTop += textContent.offsetHeight;        // 滚动
    // 最多纪录五条
    if (container.children.length > 5) {
        container.removeChild(container.firstChild);
    }

}
// 显示桌面计时窗口
function Display() {
    window.ipcRenderer.send('display');
}
// 更新时间发送到主进程
function updateSend(time) {
    window.ipcRenderer.send('update-time', time)
}

function mqttWin() {
    window.ipcRenderer.send('mqtt-win');
}

function mqttConnect() {
    var data = JSON.parse(localStorage.getItem('mqttConfig'));
    log(data.brokerUrl, data.productKey);
    window.ipcRenderer.send('mqtt-connect', data);
}



function uploadTime() {
    const date = new Date();

    const year = date.getFullYear(); // 获取年份（4 位数）
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 获取月份（0-11，需要 +1）
    const day = String(date.getDate()).padStart(2, '0'); // 获取日期（1-31）

    const formattedDate = `${year}-${month}-${day}`; // 格式化为 YYYY-MM-DD
    console.log(formattedDate);

    localStorage.getItem('url')
    // postTime(formattedDate, document.getElementById("timer").textContent)
    const data = {
        url: localStorage.getItem('url'),
        date: formattedDate,
        time: document.getElementById("timer").textContent
    }
    window.ipcRenderer.send('upload-time', data)
    console.log(formattedDate, document.getElementById("timer").textContent)

}

mqttConnect();