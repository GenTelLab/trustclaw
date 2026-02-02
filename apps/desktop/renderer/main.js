let currentConfig = {};

// Tab切换函数
function bindTabs() {
  const tabs = document.querySelectorAll("[data-tab]");
  console.log("找到标签页数量:", tabs.length);
  
  tabs.forEach((tab) => {
    // 移除旧的事件监听器（通过克隆）
    const newTab = tab.cloneNode(true);
    tab.parentNode.replaceChild(newTab, tab);
    
    newTab.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const tabName = newTab.getAttribute("data-tab");
      console.log("点击标签页:", tabName);

      // 更新导航状态
      document.querySelectorAll("[data-tab]").forEach((t) => t.classList.remove("active"));
      newTab.classList.add("active");

      // 显示对应内容
      document.querySelectorAll(".tab-content").forEach((content) => {
        content.classList.remove("active");
      });
      const targetTab = document.getElementById(`${tabName}-tab`);
      if (targetTab) {
        targetTab.classList.add("active");
        console.log("切换到标签页:", tabName);
      } else {
        console.error("找不到标签页内容:", `${tabName}-tab`);
      }
    });
  });
  
  console.log("标签页绑定完成");
}

// 加载配置
async function loadConfig() {
  try {
    currentConfig = await window.electronAPI.loadConfig();
    applyConfigToUI(currentConfig);
  } catch (err) {
    console.error("加载配置失败:", err);
    addLog("error", `加载配置失败: ${err.message}`);
  }
}

// 应用配置到UI
function applyConfigToUI(config) {
  // 安全网关配置
  const securityGateway = config.security?.gateway || {};
  document.getElementById("security-gateway-enabled").checked = securityGateway.enabled !== false;
  document.getElementById("security-base-url").value = securityGateway.baseUrl || "";
  document.getElementById("security-token").value = securityGateway.token || "";
  document.getElementById("security-timeout").value = securityGateway.timeoutMs || 5000;

  // Bot安全开关
  const channels = config.channels || {};
  document.getElementById("dm-policy-pairing").checked = true; // 默认开启
  document.getElementById("group-policy-allowlist").checked = true; // 默认开启
  document.getElementById("elevated-tools-gate").checked = true; // 默认开启
  document.getElementById("sandbox-mode").checked = config.agents?.defaults?.sandbox?.mode !== "off";
  document.getElementById("logging-redact-sensitive").checked = config.logging?.redactSensitive !== "off";

  // 频道管理
  renderChannelsList(config.channels || {});
}

// 渲染频道列表
function renderChannelsList(channels) {
  const channelsList = document.getElementById("channels-list");
  if (!channelsList) return;

  // 已知的频道列表
  const knownChannels = [
    { id: "telegram", name: "Telegram", icon: "📱" },
    { id: "whatsapp", name: "WhatsApp", icon: "💬" },
    { id: "discord", name: "Discord", icon: "🎮" },
    { id: "slack", name: "Slack", icon: "💼" },
    { id: "googlechat", name: "Google Chat", icon: "💬" },
    { id: "signal", name: "Signal", icon: "🔒" },
    { id: "imessage", name: "iMessage", icon: "💬" },
    { id: "msteams", name: "Microsoft Teams", icon: "👥" },
    { id: "line", name: "LINE", icon: "📱" },
    { id: "matrix", name: "Matrix", icon: "🔷" },
    { id: "zalo", name: "Zalo", icon: "📱" },
    { id: "feishu", name: "Feishu (飞书)", icon: "📋" },
  ];

  if (Object.keys(channels).length === 0) {
    channelsList.innerHTML = `
      <div class="channels-empty">
        <p style="color: #666; margin-bottom: 1rem;">暂无配置的频道</p>
        <p style="color: #999; font-size: 0.9rem;">
          频道配置需要通过在 CLI 中运行 <code>openclaw channels login</code> 或 <code>openclaw onboard</code> 来设置。
        </p>
        <p style="color: #999; font-size: 0.9rem; margin-top: 0.5rem;">
          配置完成后，频道信息将显示在这里。
        </p>
      </div>
    `;
    return;
  }

  let html = '<div class="channels-grid">';
  
  for (const channel of knownChannels) {
    const channelConfig = channels[channel.id];
    if (!channelConfig) continue;

    const enabled = channelConfig.enabled !== false;
    const accountIds = channelConfig.accounts ? Object.keys(channelConfig.accounts) : [];
    const hasConfig = channelConfig.token || channelConfig.appId || channelConfig.appSecret || accountIds.length > 0;

    html += `
      <div class="channel-card ${enabled ? "enabled" : "disabled"}">
        <div class="channel-header">
          <span class="channel-icon">${channel.icon}</span>
          <h3>${channel.name}</h3>
          <span class="channel-status ${enabled ? "status-enabled" : "status-disabled"}">
            ${enabled ? "✓ 已启用" : "✗ 已禁用"}
          </span>
        </div>
        <div class="channel-details">
          ${hasConfig ? `
            <div class="channel-info">
              <span class="info-label">状态:</span>
              <span class="info-value">${enabled ? "运行中" : "未运行"}</span>
            </div>
            ${accountIds.length > 0 ? `
              <div class="channel-info">
                <span class="info-label">账户数:</span>
                <span class="info-value">${accountIds.length}</span>
              </div>
            ` : ""}
          ` : `
            <div class="channel-info">
              <span class="info-label">状态:</span>
              <span class="info-value" style="color: #999;">未配置</span>
            </div>
          `}
        </div>
      </div>
    `;
  }

  html += "</div>";
  channelsList.innerHTML = html;
}

// 保存配置
async function saveConfig() {
  console.log("saveConfig 函数被调用");
  const saveBtn = document.getElementById("save-security-config");
  if (!saveBtn) {
    console.error("保存按钮不存在");
    alert("保存按钮未找到，请刷新页面");
    return;
  }
  
  const originalText = saveBtn?.textContent || "保存配置";
  
  try {
    console.log("开始保存配置...");
    // 禁用按钮，显示保存中状态
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = "保存中...";
    }

    // 收集安全网关配置
    const securityGateway = {
      enabled: document.getElementById("security-gateway-enabled")?.checked !== false,
      baseUrl: document.getElementById("security-base-url")?.value?.trim() || undefined,
      token: document.getElementById("security-token")?.value?.trim() || undefined,
      timeoutMs: parseInt(document.getElementById("security-timeout")?.value) || 5000,
    };

    // 收集Bot安全开关配置
    const updatedConfig = {
      ...currentConfig,
      security: {
        ...(currentConfig.security || {}),
        gateway: securityGateway,
      },
      agents: {
        ...(currentConfig.agents || {}),
        defaults: {
          ...(currentConfig.agents?.defaults || {}),
          sandbox: {
            ...(currentConfig.agents?.defaults?.sandbox || {}),
            mode: document.getElementById("sandbox-mode")?.checked ? "all" : "off",
          },
        },
      },
      logging: {
        ...(currentConfig.logging || {}),
        redactSensitive: document.getElementById("logging-redact-sensitive")?.checked ? "tools" : "off",
      },
    };

    console.log("配置数据收集完成，准备保存:", JSON.stringify(updatedConfig, null, 2));
    
    // 检查 electronAPI 是否可用
    if (!window.electronAPI || !window.electronAPI.saveConfig) {
      throw new Error("electronAPI.saveConfig 不可用，请检查 Electron 环境");
    }
    
    // 保存到本地JSON文件
    console.log("调用 electronAPI.saveConfig...");
    const result = await window.electronAPI.saveConfig(updatedConfig);
    console.log("保存结果:", result);
    
    if (result) {
      currentConfig = updatedConfig;
      addLog("info", "配置已保存到 ~/.openclaw/openclaw.json");
      
      // 显示成功反馈
      if (saveBtn) {
        saveBtn.textContent = "✓ 已保存";
        saveBtn.style.background = "#27ae60";
        setTimeout(() => {
          saveBtn.textContent = originalText;
          saveBtn.style.background = "";
          saveBtn.disabled = false;
        }, 2000);
      }
    } else {
      throw new Error("保存返回失败");
    }
  } catch (err) {
    console.error("保存配置失败:", err);
    const errorMsg = err?.message || String(err);
    addLog("error", `保存配置失败: ${errorMsg}`);
    
    // 显示错误反馈
    if (saveBtn) {
      saveBtn.textContent = "✗ 保存失败";
      saveBtn.style.background = "#e74c3c";
      setTimeout(() => {
        saveBtn.textContent = originalText;
        saveBtn.style.background = "";
        saveBtn.disabled = false;
      }, 2000);
    }
    
    // 显示错误对话框
    alert(`保存配置失败: ${errorMsg}\n\n请检查：\n1. 配置文件路径是否有写入权限\n2. 磁盘空间是否充足`);
  }
}

// CLI执行
let cliOutputElement = null;

// 延迟绑定CLI按钮，确保DOM已加载
function bindCLIButtons() {
  const executeBtn = document.getElementById("execute-cli-btn");
  const stopBtn = document.getElementById("stop-cli-btn");
  
  if (executeBtn) {
    executeBtn.addEventListener("click", async () => {
      const command = document.getElementById("cli-command").value.trim();
      if (!command) {
        alert("请输入命令");
        return;
      }

      const args = command.split(" ").filter((arg) => arg.length > 0);
      cliOutputElement = document.getElementById("cli-output");
      cliOutputElement.textContent = "";

      try {
        addLog("info", `执行命令: openclaw ${args.join(" ")}`);
        const result = await window.electronAPI.executeCLI(args);
        addLog("info", `命令执行完成，退出码: ${result.code}`);
      } catch (err) {
        addLog("error", `命令执行失败: ${err.message}`);
      }
    });
  }
  
  if (stopBtn) {
    stopBtn.addEventListener("click", () => {
      window.electronAPI.stopCLI();
      addLog("info", "已停止CLI执行");
    });
  }
}

// 注意：bindCLIButtons 会在 init() 函数中调用，这里不需要立即执行

// CLI输出监听函数（会在初始化时调用）
function setupCLIOutputListener() {
  if (window.electronAPI && window.electronAPI.onCLIOutput) {
    window.electronAPI.onCLIOutput((data) => {
      if (cliOutputElement) {
        const className = data.type === "stderr" ? "stderr" : "stdout";
        const span = document.createElement("span");
        span.className = className;
        span.textContent = data.data;
        cliOutputElement.appendChild(span);
        cliOutputElement.scrollTop = cliOutputElement.scrollHeight;
      }
    });
  } else {
    console.warn("window.electronAPI.onCLIOutput 不可用，延迟设置");
    setTimeout(setupCLIOutputListener, 100);
  }
}

// 保存配置按钮绑定函数
function bindSaveButton() {
  const saveBtn = document.getElementById("save-security-config");
  if (!saveBtn) {
    console.error("保存按钮未找到，ID: save-security-config");
    return false;
  }
  
  // 移除所有现有的事件监听器（通过克隆节点）
  const newBtn = saveBtn.cloneNode(true);
  saveBtn.parentNode.replaceChild(newBtn, saveBtn);
  
  // 绑定新的事件监听器
  newBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("保存按钮被点击 - 开始保存配置");
    addLog("info", "开始保存配置...");
    try {
      await saveConfig();
    } catch (error) {
      console.error("保存配置时出错:", error);
      addLog("error", `保存配置时出错: ${error.message}`);
      alert(`保存配置时出错: ${error.message}`);
    }
  });
  
  // 添加鼠标悬停提示
  newBtn.title = "点击保存当前安全配置";
  console.log("保存按钮已成功绑定，按钮ID:", newBtn.id);
  return true;
}

// 启动Bot按钮
let gatewayRunning = false;

function bindGatewayButton() {
  const btn = document.getElementById("start-clawdbot-btn");
  if (!btn) {
    console.error("启动按钮未找到");
    return;
  }
  
  // 移除旧的事件监听器（通过克隆）
  const newBtn = btn.cloneNode(true);
  btn.parentNode.replaceChild(newBtn, btn);
  
  newBtn.addEventListener("click", async () => {
    const originalText = newBtn.textContent;
    
    if (gatewayRunning) {
      // 如果正在运行，则停止
      try {
        newBtn.disabled = true;
        newBtn.textContent = "正在停止...";
        const result = await window.electronAPI.stopGateway();
        if (result.success) {
          gatewayRunning = false;
          newBtn.textContent = "启动Bot";
          newBtn.classList.remove("btn-success");
          addLog("info", "Bot Gateway 已停止");
        }
        newBtn.disabled = false;
      } catch (err) {
        addLog("error", `停止 Bot 失败: ${err.message}`);
        newBtn.disabled = false;
      }
      return;
    }
    
    try {
      newBtn.disabled = true;
      newBtn.textContent = "正在启动...";
      addLog("info", "正在启动 Bot Gateway...");
      
      // 启动 Gateway（后台运行）
      const result = await window.electronAPI.startGateway();
      
      if (result.success) {
        gatewayRunning = true;
        newBtn.textContent = "停止Bot";
        newBtn.classList.add("btn-success");
        addLog("info", `Bot Gateway 启动成功 (PID: ${result.pid || "N/A"})`);
        addLog("info", "Gateway 运行在 http://0.0.0.0:18789 (所有网络接口)");
        addLog("info", "本地访问: http://127.0.0.1:18789");
        addLog("info", "局域网访问: http://<本机IP>:18789");
        addLog("info", "正在自动打开 Control UI 对话框...");
        addLog("info", "提示: 如果看到 'unauthorized' 错误，请在 Control UI 设置中粘贴 Gateway token");
      } else {
        addLog("error", `Bot Gateway 启动失败: ${result.message || "未知错误"}`);
        newBtn.textContent = "启动失败";
        setTimeout(() => {
          newBtn.textContent = originalText;
          newBtn.disabled = false;
        }, 2000);
      }
      newBtn.disabled = false;
    } catch (err) {
      addLog("error", `启动 Bot 失败: ${err.message}`);
      newBtn.textContent = "启动失败";
      setTimeout(() => {
        newBtn.textContent = originalText;
        newBtn.disabled = false;
      }, 2000);
    }
  });
}

// 监听 Gateway 输出（会在初始化时设置）

// 日志功能（必须在初始化之前定义）
function addLog(level, message) {
  try {
    // 输出到CLI执行面板的日志区域
    const logsOutput = document.getElementById("logs-output");
    
    if (logsOutput) {
      const entry = document.createElement("div");
      entry.className = `log-entry log-${level}`;
      const timestamp = new Date().toLocaleTimeString();
      entry.textContent = `[${timestamp}] ${message}`;
      logsOutput.appendChild(entry);
      logsOutput.scrollTop = logsOutput.scrollHeight;
    } else {
      // 如果日志输出元素不存在，只输出到控制台
      console.log(`[${level}] ${message}`);
    }
  } catch (err) {
    // 如果出错，至少输出到控制台
    console.error("addLog 错误:", err, "消息:", message);
  }
}

// ============ Skills 技能管理 ============

let skillRunning = false;
let currentOutputDir = null;

function bindSkillsUI() {
  // 模式切换
  const modeSelect = document.getElementById("gamecode-mode");
  const templateOptions = document.getElementById("gamecode-template-options");
  const aiOptions = document.getElementById("gamecode-ai-options");
  
  if (modeSelect) {
    modeSelect.addEventListener("change", () => {
      const isAI = modeSelect.value === "ai";
      templateOptions.style.display = isAI ? "none" : "block";
      aiOptions.style.display = isAI ? "block" : "none";
    });
  }
  
  // 浏览目录按钮
  const browseBtn = document.getElementById("gamecode-browse-btn");
  if (browseBtn) {
    browseBtn.addEventListener("click", async () => {
      try {
        const folder = await window.electronAPI.browseFolder();
        if (folder) {
          document.getElementById("gamecode-output-dir").value = folder;
        }
      } catch (err) {
        addLog("error", `浏览目录失败: ${err.message}`);
      }
    });
  }
  
  // 配置按钮（展开/折叠配置区域）
  const configBtn = document.getElementById("skill-gamecode-config-btn");
  const configSection = document.getElementById("skill-gamecode-config");
  
  if (configBtn && configSection) {
    configBtn.addEventListener("click", () => {
      const isHidden = configSection.style.display === "none";
      configSection.style.display = isHidden ? "block" : "none";
      configBtn.textContent = isHidden ? "⚙️ 隐藏配置" : "⚙️ 配置";
    });
  }
  
  // 执行按钮
  const runBtn = document.getElementById("skill-gamecode-run-btn");
  const stopBtn = document.getElementById("skill-gamecode-stop-btn");
  const openBtn = document.getElementById("skill-gamecode-open-btn");
  const outputSection = document.getElementById("skill-gamecode-output");
  const outputContent = outputSection?.querySelector(".skill-output-content");
  
  if (runBtn) {
    runBtn.addEventListener("click", async () => {
      const outputDir = document.getElementById("gamecode-output-dir").value.trim();
      if (!outputDir) {
        alert("请先选择输出目录");
        return;
      }
      
      const mode = document.getElementById("gamecode-mode").value;
      
      const options = {
        mode,
        outputDir,
      };
      
      if (mode === "ai") {
        const prompt = document.getElementById("gamecode-prompt").value.trim();
        if (!prompt) {
          alert("请输入游戏需求描述");
          return;
        }
        options.prompt = prompt;
        options.model = document.getElementById("gamecode-model").value;
        const apiKey = document.getElementById("gamecode-apikey").value.trim();
        if (apiKey) {
          options.apiKey = apiKey;
        }
      } else {
        options.type = document.getElementById("gamecode-type").value;
        const title = document.getElementById("gamecode-title").value.trim();
        if (title) {
          options.title = title;
        }
      }
      
      // UI 状态更新
      skillRunning = true;
      currentOutputDir = outputDir;
      runBtn.disabled = true;
      runBtn.textContent = "⏳ 生成中...";
      stopBtn.disabled = false;
      openBtn.disabled = true;
      outputSection.style.display = "block";
      outputContent.innerHTML = "";
      
      addLog("info", `开始生成游戏: ${mode === "ai" ? "AI模式" : "模板模式"}`);
      
      try {
        await window.electronAPI.runSkill("gamecode", options);
      } catch (err) {
        addLog("error", `执行失败: ${err.message}`);
        outputContent.innerHTML += `<span class="error">错误: ${err.message}</span>\n`;
      }
    });
  }
  
  // 停止按钮
  if (stopBtn) {
    stopBtn.addEventListener("click", () => {
      window.electronAPI.stopSkill("gamecode");
      addLog("info", "已停止游戏生成");
    });
  }
  
  // 打开目录按钮
  if (openBtn) {
    openBtn.addEventListener("click", async () => {
      if (currentOutputDir) {
        await window.electronAPI.openFolder(currentOutputDir);
      }
    });
  }
  
  // 监听 Skill 输出
  if (window.electronAPI && window.electronAPI.onSkillOutput) {
    window.electronAPI.onSkillOutput((skillId, data) => {
      if (skillId === "gamecode" && outputContent) {
        const className = data.type === "stderr" ? "error" : "info";
        outputContent.innerHTML += `<span class="${className}">${escapeHtml(data.data)}</span>`;
        outputContent.scrollTop = outputContent.scrollHeight;
      }
    });
  }
  
  // 监听 Skill 完成
  if (window.electronAPI && window.electronAPI.onSkillComplete) {
    window.electronAPI.onSkillComplete((skillId, result) => {
      if (skillId === "gamecode") {
        skillRunning = false;
        runBtn.disabled = false;
        runBtn.textContent = "▶️ 执行";
        stopBtn.disabled = true;
        
        if (result.success) {
          addLog("info", "🎮 游戏生成成功！");
          outputContent.innerHTML += `<span class="success">\n✅ 游戏生成成功！\n📂 输出目录: ${escapeHtml(result.outputDir)}</span>\n`;
          openBtn.disabled = false;
        } else {
          addLog("error", `游戏生成失败: ${result.error || `退出码 ${result.code}`}`);
          outputContent.innerHTML += `<span class="error">\n❌ 生成失败</span>\n`;
        }
      }
    });
  }
  
  console.log("✓ Skills UI 绑定完成");
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// 初始化
async function init() {
  console.log("=== 开始初始化 ===");
  console.log("DOM状态:", document.readyState);
  console.log("window.electronAPI:", typeof window.electronAPI);
  
  // 等待DOM完全加载
  if (document.readyState === "loading") {
    console.log("等待DOM加载...");
    await new Promise((resolve) => {
      document.addEventListener("DOMContentLoaded", resolve);
    });
  }
  
  console.log("DOM已加载，开始绑定事件...");
  
  // 绑定标签页（必须在最前面）
  try {
    bindTabs();
    console.log("✓ 标签页绑定成功");
  } catch (err) {
    console.error("✗ 标签页绑定失败:", err);
    addLog("error", `标签页绑定失败: ${err.message}`);
  }
  
  // 加载配置
  try {
    await loadConfig();
    console.log("✓ 配置加载成功");
  } catch (err) {
    console.error("✗ 配置加载失败:", err);
    addLog("error", `配置加载失败: ${err.message}`);
  }
  
  // 绑定保存按钮
  let retryCount = 0;
  const maxRetries = 5;
  while (retryCount < maxRetries) {
    try {
      if (bindSaveButton()) {
        console.log("✓ 保存按钮绑定成功");
        break;
      } else {
        retryCount++;
        console.log(`保存按钮绑定失败，重试 ${retryCount}/${maxRetries}...`);
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    } catch (err) {
      console.error("保存按钮绑定异常:", err);
      retryCount++;
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  
  if (retryCount >= maxRetries) {
    console.error("✗ 保存按钮绑定失败，已达到最大重试次数");
    addLog("error", "保存按钮初始化失败，请刷新页面");
  }
  
  // 绑定Gateway按钮
  try {
    bindGatewayButton();
    console.log("✓ Gateway按钮绑定成功");
  } catch (err) {
    console.error("✗ Gateway按钮绑定失败:", err);
    addLog("error", `Gateway按钮绑定失败: ${err.message}`);
  }
  
  // 绑定CLI按钮
  try {
    bindCLIButtons();
    console.log("✓ CLI按钮绑定成功");
  } catch (err) {
    console.error("✗ CLI按钮绑定失败:", err);
    addLog("error", `CLI按钮绑定失败: ${err.message}`);
  }
  
  // 绑定Skills UI
  try {
    bindSkillsUI();
    console.log("✓ Skills UI绑定成功");
  } catch (err) {
    console.error("✗ Skills UI绑定失败:", err);
    addLog("error", `Skills UI绑定失败: ${err.message}`);
  }
  
  // 设置CLI输出监听
  try {
    setupCLIOutputListener();
    console.log("✓ CLI输出监听设置成功");
  } catch (err) {
    console.error("✗ CLI输出监听设置失败:", err);
  }
  
  // 设置Gateway输出监听
  try {
    if (window.electronAPI && window.electronAPI.onGatewayOutput) {
      window.electronAPI.onGatewayOutput((data) => {
        addLog(data.type === "stderr" ? "error" : "info", data.data.trim());
      });
      console.log("✓ Gateway输出监听设置成功");
    } else {
      console.warn("window.electronAPI.onGatewayOutput 不可用");
    }
  } catch (err) {
    console.error("✗ Gateway输出监听设置失败:", err);
  }
  
  
  // 测试按钮点击
  console.log("测试按钮元素是否存在:");
  console.log("  保存按钮:", document.getElementById("save-security-config") ? "存在" : "不存在");
  console.log("  启动按钮:", document.getElementById("start-clawdbot-btn") ? "存在" : "不存在");
  console.log("  执行按钮:", document.getElementById("execute-cli-btn") ? "存在" : "不存在");
  
  console.log("=== 初始化完成 ===");
  addLog("info", "应用初始化完成");
}

// 确保在DOM完全加载后再初始化
(function() {
  console.log("脚本开始执行，DOM状态:", document.readyState);
  
  if (document.readyState === "loading") {
    console.log("等待DOMContentLoaded事件...");
    document.addEventListener("DOMContentLoaded", () => {
      console.log("DOMContentLoaded 事件触发");
      // 延迟一点确保所有元素都已渲染
      setTimeout(() => {
        init().catch(err => {
          console.error("初始化过程中出错:", err);
          if (typeof addLog === "function") {
            addLog("error", `初始化失败: ${err.message}`);
          }
        });
      }, 100);
    });
  } else if (document.readyState === "interactive" || document.readyState === "complete") {
    console.log("DOM已就绪，立即初始化");
    // 延迟一点确保所有元素都已渲染
    setTimeout(() => {
      init().catch(err => {
        console.error("初始化过程中出错:", err);
        if (typeof addLog === "function") {
          addLog("error", `初始化失败: ${err.message}`);
        }
      });
    }, 100);
  }
})();
