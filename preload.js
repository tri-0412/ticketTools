const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    updateTicketStatus: (ticketCode) => ipcRenderer.invoke('update-ticket-status', ticketCode)
});