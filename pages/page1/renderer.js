// 接收主进程发来的信息
window.ipcRenderer.on('settime',(event,data)=> {
    document.getElementById("timer").textContent = data;
    console.log(data)
})