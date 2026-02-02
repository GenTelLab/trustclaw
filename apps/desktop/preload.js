const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  loadConfig: () => ipcRenderer.invoke("load-config"),
  saveConfig: (config) => ipcRenderer.invoke("save-config", config),
  executeCLI: (args) => ipcRenderer.invoke("execute-cli", args),
  stopCLI: () => ipcRenderer.send("stop-cli"),
  startGateway: () => ipcRenderer.invoke("start-gateway"),
  stopGateway: () => ipcRenderer.invoke("stop-gateway"),
  showSecurityDialog: (options) => ipcRenderer.invoke("show-security-dialog", options),
  // Skill 相关
  runSkill: (skillId, options) => ipcRenderer.invoke("run-skill", skillId, options),
  stopSkill: (skillId) => ipcRenderer.send("stop-skill", skillId),
  browseFolder: () => ipcRenderer.invoke("browse-folder"),
  openFolder: (path) => ipcRenderer.invoke("open-folder", path),
  onCLIOutput: (callback) => {
    ipcRenderer.on("cli-output", (_event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners("cli-output");
  },
  onGatewayOutput: (callback) => {
    ipcRenderer.on("gateway-output", (_event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners("gateway-output");
  },
  onGatewayStatus: (callback) => {
    ipcRenderer.on("gateway-status", (_event, status, detail) => callback(status, detail));
    return () => ipcRenderer.removeAllListeners("gateway-status");
  },
  onSkillOutput: (callback) => {
    ipcRenderer.on("skill-output", (_event, skillId, data) => callback(skillId, data));
    return () => ipcRenderer.removeAllListeners("skill-output");
  },
  onSkillComplete: (callback) => {
    ipcRenderer.on("skill-complete", (_event, skillId, result) => callback(skillId, result));
    return () => ipcRenderer.removeAllListeners("skill-complete");
  },
});
