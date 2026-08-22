// Preload script - contextIsolation açıkken renderer'a (React uygulamasına)
// güvenli, sınırlı bir köprü sağlar. Renderer'a Node/Electron API'lerinin
// tamamını açmak yerine sadece pencere kontrol fonksiyonlarını expose eder.
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  toggleMaximizeWindow: () => ipcRenderer.send('window:maximize-toggle'),
  closeWindow: () => ipcRenderer.send('window:close'),
  isWindowMaximized: () => ipcRenderer.invoke('window:is-maximized'),
  onWindowMaximizedChange: (callback) => {
    const listener = (_event, isMaximized) => callback(isMaximized)
    ipcRenderer.on('window:maximized-changed', listener)
    return () => ipcRenderer.removeListener('window:maximized-changed', listener)
  },
})
