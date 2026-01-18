# VS Code智能助手插件

基于React框架的VS Code插件，集成DeepSeek AI模型，提供智能对话功能。

## 项目结构

```
├── src/                     # 插件源代码
│   ├── extension.ts        # 插件入口文件
│   ├── panels/             # Webview面板相关代码
│   │   └── smartAssistantPanel.ts
│   └── utils/              # 工具类
│       └── apiService.ts
├── webviews/               # React前端代码
│   ├── index.tsx           # React应用入口
│   ├── components/         # React组件
│   │   ├── App.tsx
│   │   └── ChatInterface.tsx
│   └── styles.css          # 样式文件
├── .vscode/                # VS Code配置
│   ├── launch.json         # 调试配置
│   └── tasks.json          # 任务配置
├── package.json            # 项目配置
├── tsconfig.json           # TypeScript配置
├── webpack.config.js       # Webpack配置
└── README.md               # 项目说明
```

## 功能特性

- 智能问答界面：在VS Code中提供可输入问题的交互面板
- 模型响应展示：清晰展示AI模型的回复内容
- 模型配置管理：支持用户配置模型，如填写deepseek token
- 流式响应：支持AI回复内容的实时流式输出
- Markdown渲染：支持Markdown、代码块等富文本格式渲染

## 安装依赖

```bash
npm install
```

## 构建项目

```bash
# 编译TypeScript
npm run compile

# 构建Webview
npm run build-webview

# 或者开发模式下构建Webview
npm run build-webview-dev
```

## 开发调试

1. 安装依赖：`npm install`
2. 启动开发服务器：`npm run watch`
3. 在VS Code中按F5启动调试
4. 在调试窗口中运行命令 `智能助手: 打开智能助手聊天面板`

## 配置说明

在VS Code设置中可以配置以下参数：

- `smartAssistant.deepseekToken`: DeepSeek API Token
- `smartAssistant.model`: 使用的AI模型名称，默认为'deepseek-chat'

## 使用方法

1. 安装插件后，在VS Code中按下Ctrl+Shift+P打开命令面板
2. 输入"智能助手: 打开智能助手聊天面板"并执行
3. 在弹出的面板中输入问题并发送
4. 查看AI的回答

或者右键点击编辑器区域，在上下文菜单中选择"打开智能助手聊天面板"。