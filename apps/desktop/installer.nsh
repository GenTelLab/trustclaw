; TrustClaw NSIS 自定义安装脚本

!macro customHeader
  ; 自定义头部
!macroend

!macro preInit
  ; 安装前初始化
!macroend

!macro customInit
  ; 独立安装包已内置 OpenClaw CLI，无需检查
!macroend

!macro customInstall
  ; 安装完成后的自定义操作
  
  ; 解压 openclaw.zip 到 resources\openclaw 目录
  DetailPrint "正在解压核心组件..."
  SetDetailsPrint textonly
  
  ; 使用 PowerShell 解压 (Windows 10+ 内置)
  nsExec::ExecToLog 'powershell -ExecutionPolicy Bypass -Command "Expand-Archive -Path \"$INSTDIR\resources\openclaw.zip\" -DestinationPath \"$INSTDIR\resources\openclaw\" -Force"'
  Pop $0
  
  ; 删除 zip 文件节省空间
  Delete "$INSTDIR\resources\openclaw.zip"
  
  SetDetailsPrint both
  DetailPrint "核心组件解压完成"
  
  ; 检查是否已存在配置，不存在则复制默认配置
  IfFileExists "$PROFILE\.openclaw\openclaw.json" SkipFullCopy
    
    ; 创建目录结构
    CreateDirectory "$PROFILE\.openclaw"
    CreateDirectory "$PROFILE\.openclaw\workspace"
    CreateDirectory "$PROFILE\.openclaw\workspace\memory"
    CreateDirectory "$PROFILE\.openclaw\agents"
    CreateDirectory "$PROFILE\.openclaw\agents\main"
    CreateDirectory "$PROFILE\.openclaw\agents\main\agent"
    CreateDirectory "$PROFILE\.openclaw\agents\main\sessions"
    CreateDirectory "$PROFILE\.openclaw\cron"
    CreateDirectory "$PROFILE\.openclaw\identity"
    CreateDirectory "$PROFILE\.openclaw\devices"
    CreateDirectory "$PROFILE\.openclaw\canvas"
    CreateDirectory "$PROFILE\.openclaw\sandboxes"
    
    ; 复制配置文件（路径占位符将在应用启动时替换）
    CopyFiles /SILENT "$INSTDIR\resources\default-openclaw\openclaw.json" "$PROFILE\.openclaw\openclaw.json"
    
    ; 复制 workspace 文件
    CopyFiles /SILENT "$INSTDIR\resources\default-openclaw\workspace\*.*" "$PROFILE\.openclaw\workspace\"
    
    ; 复制 workspace/memory 文件
    IfFileExists "$INSTDIR\resources\default-openclaw\workspace\memory\*.*" 0 +2
      CopyFiles /SILENT "$INSTDIR\resources\default-openclaw\workspace\memory\*.*" "$PROFILE\.openclaw\workspace\memory\"
    
    ; 复制 agents 配置
    IfFileExists "$INSTDIR\resources\default-openclaw\agents\main\agent\*.*" 0 +2
      CopyFiles /SILENT "$INSTDIR\resources\default-openclaw\agents\main\agent\*.*" "$PROFILE\.openclaw\agents\main\agent\"
    
    ; 复制 cron 配置
    IfFileExists "$INSTDIR\resources\default-openclaw\cron\*.*" 0 +2
      CopyFiles /SILENT "$INSTDIR\resources\default-openclaw\cron\*.*" "$PROFILE\.openclaw\cron\"
    
  SkipFullCopy:
!macroend

!macro customUnInstall
  ; 卸载时的自定义操作
  ; 注意：不删除配置文件，保留用户数据
  
  ; 删除解压的 openclaw 目录
  RMDir /r "$INSTDIR\resources\openclaw"
!macroend
