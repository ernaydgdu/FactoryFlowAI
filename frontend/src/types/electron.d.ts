// Electron ana sürecinin preload.cjs üzerinden expose ettiği pencere kontrol
// API'si. Sadece Electron içinde çalışırken mevcuttur (window.electronAPI) -
// normal tarayıcıda undefined kalır.
export type ElectronWindowAPI = {
  minimizeWindow: () => void
  toggleMaximizeWindow: () => void
  closeWindow: () => void
  isWindowMaximized: () => Promise<boolean>
  onWindowMaximizedChange: (callback: (isMaximized: boolean) => void) => () => void
}

declare global {
  interface Window {
    electronAPI?: ElectronWindowAPI
  }
}
