import { contextBridge, ipcRenderer } from 'electron'
import type { MiraBridge } from '../shared/types'

const bridge: MiraBridge = {
  getConfig: () => ipcRenderer.invoke('config:get'),
  saveConfig: (c) => ipcRenderer.invoke('config:save', c),
  saveSession: (i) => ipcRenderer.invoke('session:save', i),
  updateSession: (m) => ipcRenderer.invoke('session:update', m),
  listSessions: (eventId) => ipcRenderer.invoke('session:list', eventId),
  deleteSession: (eventId, sessionId) => ipcRenderer.invoke('session:delete', eventId, sessionId),
  print: (i) => ipcRenderer.invoke('print:enqueue', i),
  printTestPage: (d) => ipcRenderer.invoke('print:test', d),
  sendEmail: (i) => ipcRenderer.invoke('email:send', i),
  getStatus: () => ipcRenderer.invoke('status:get'),
  quit: () => ipcRenderer.invoke('app:quit')
}

contextBridge.exposeInMainWorld('mira', bridge)
