window.ipcRenderer.on('settime',(event,data)=> {
    document.getElementById("timer").textContent = data;
    console.log(data)
})