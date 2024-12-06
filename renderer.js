/**
 * This file is loaded via the <script> tag in the index.html file and will
 * be executed in the renderer process for that window. No Node.js APIs are
 * available in this process because `nodeIntegration` is turned off and
 * `contextIsolation` is turned on. Use the contextBridge API in `preload.js`
 * to expose Node.js functionality from the main process.
 */
let seconds = 0;
let interval = null;

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

    document.getElementById("timer").textContent = hours + ":" + minutes + ":" + secs;
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
}

function resetTimer() {
    clearInterval(interval);
    interval = null;
    seconds = 0;
    updateTimer();
    document.getElementById("startPauseBtn").textContent = "Start";
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
    // 禁用按键默认行为
    if (event.key === 'F11') {
        event.preventDefault();
    } else if (event.key === 'Space') {
        event.preventDefault();
    }
});

// 弹窗部分内容
var modal = document.getElementById("myModal");
var btn = document.getElementById("saveIdButton");
var span = document.getElementsByClassName("close")[0]; // 第一个弹窗

// 打开弹窗
function openModal() {
    modal.style.display = "block";
}

// 关闭弹窗
span.onclick = function () {
    modal.style.display = "none";
}

// 点击保存按钮时保存ID并关闭弹窗
btn.onclick = function () {
    var idInput = document.getElementById('playlistIdInput');
    var id = idInput.value;
    const regex = /id=(\d+)/;
    const match = id.match(regex);
    console.log(match);             // 奇怪，解析结果有点问题
    localStorage.setItem('playlistId', match[1]); // 保存ID到localStorage
    modal.style.display = "none";       // 关闭弹窗
    window.location.reload();
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
window.spaceEvent.spaceKey(() => {
    startPauseTimer();
})