; OpenClaw SecurityAudit-CN NSIS 自定义安装脚本

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
  ; 创建配置目录
  CreateDirectory "$PROFILE\.openclaw"
!macroend

!macro customUnInstall
  ; 卸载时的自定义操作
!macroend
