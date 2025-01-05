/**
 * The preload script runs before `index.html` is loaded
 * in the renderer. It has access to web APIs as well as
 * Electron's renderer process modules and some polyfilled
 * Node.js functions.
 *
 * https://www.electronjs.org/docs/latest/tutorial/sandbox
 */
// const { contextBridge, ipcRenderer } = require('electron');

// contextBridge.exposeInMainWorld('spaceEvent', {
//   spaceKey: (callback) => ipcRenderer.on('Space_key', () => callback()),
// })
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ipcRenderer', {
  send: (channel, data) => {
    ipcRenderer.send(channel, data);
  },
  on: (channel, data) => {
    ipcRenderer.on(channel, data);
  },
})

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }

  // load the music player
  var container = document.getElementById('music-player');
  const savedId = localStorage.getItem('playlistId');
  if (container) {
    if (savedId) {
      container.innerHTML = ' <meting-js server="netease" type="playlist" id="' + savedId + '" mini="false" list-folded="true">';
    } else {
      container.innerHTML = ' <meting-js server="netease" type="playlist" id="7515376033" mini="false" list-folded="true">';

    }
  }

  // console.log(container);
})
