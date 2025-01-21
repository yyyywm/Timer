var data = {};

// web storage
data = JSON.parse(localStorage.getItem('mqttConfig'));
console.log(data.brokerUrl,data.productKey);
if(data){
    document.getElementById('productKey').value = data.productKey;
    document.getElementById('deviceName').value = data.deviceName;
    document.getElementById('deviceSecret').value = data.deviceSecret;
    document.getElementById('brokerUrl').value = data.brokerUrl;
    console.log(data);
}

function TestConnect() {
    data.productKey = document.getElementById('productKey').value;
    data.deviceName = document.getElementById('deviceName').value;
    data.deviceSecret = document.getElementById('deviceSecret').value;
    data.brokerUrl = document.getElementById('brokerUrl').value;
    localStorage.setItem('mqttConfig',JSON.stringify(data))
    window.ipcRenderer.send('mqtt-connect',data)  // send
    // console.log(data.brokerUrl,data.productKey);
}

function SaveConnect(){
    TestConnect();
    window.close();
}

window.ipcRenderer.on('mqtt-ready',(event,data)=> { 
    var status = document.getElementById("status");
    console.log(data);
    status.textContent = "已连接";
    status.style.color = "green";

})