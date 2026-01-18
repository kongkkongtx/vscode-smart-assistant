# VS Code智能助手插件

基于React框架的VS Code插件，集成多种AI模型（包括DeepSeek、OpenAI、Anthropic等），提供智能对话功能。

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
│   │   ├── ChatInterface.tsx
│   │   ├── HistoryPanel.tsx
│   │   └── MainLayout.tsx
│   ├── index.html          # Webview入口HTML文件
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
- 多模型支持：支持DeepSeek、OpenAI、Anthropic、Kimi等多种AI模型
- 模型切换：支持无痛切换模型，不影响当前对话历史
- 历史对话管理：支持查看、创建、删除历史对话会话
- 侧滑面板：历史对话面板支持侧滑显示，提升用户体验
- 流式响应：支持AI回复内容的实时流式输出
- Markdown渲染：支持Markdown、代码块等富文本格式渲染
- 语法高亮：代码块支持多种编程语言的语法高亮
- 响应式设计：适配不同屏幕尺寸，提供良好的用户体验
- 模型配置管理：支持用户配置各种AI模型的API Token

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

## 技术栈

- **前端**: React, TypeScript
- **UI框架**: 原生CSS
- **代码高亮**: highlight.js
- **构建工具**: Webpack
- **后端**: VS Code Extension API
- **通信协议**: Webview Message Passing

## 开发调试

1. 安装依赖：`npm install`
2. 启动开发服务器：`npm run watch`
3. 在VS Code中按F5启动调试
4. 在调试窗口中运行命令 `智能助手: 打开智能助手聊天面板`

## 配置说明

在VS Code设置中可以配置以下参数：

- `smartAssistant.deepseekToken`: DeepSeek API Token
- `smartAssistant.openaiToken`: OpenAI API Token
- `smartAssistant.claudeToken`: Anthropic Claude API Token
- `smartAssistant.kimiToken`: Kimi API Token
- `smartAssistant.openrouterToken`: OpenRouter API Token
- `smartAssistant.selectedModel`: 当前使用的AI模型，默认为'deepseek-chat'
- `smartAssistant.openrouterModel`: OpenRouter 模型名称

## 使用方法

1. 安装插件后，在VS Code中按下Ctrl+Shift+P打开命令面板
2. 输入"智能助手: 打开智能助手聊天面板"并执行
3. 在弹出的面板中选择需要的AI模型
4. 输入问题并发送
5. 查看AI的回答

或者右键点击编辑器区域，在上下文菜单中选择"打开智能助手聊天面板"。

## 历史对话功能

- 点击左上角的"历史对话"按钮可查看历史对话记录
- 点击历史对话可快速切换到该会话
- 可创建新对话或删除不需要的对话
- 支持侧滑面板显示历史对话列表

## 发布到VS Code Marketplace

如果您希望将插件发布到VS Code官方市场：

1. 安装vsce工具：
```bash
npm install -g vsce
```

2. 登录Azure DevOps：
```bash
vsce login 你的发布者名称
```

3. 打包并发布：
```bash
vsce package
vsce publish
```

## 许可证

MIT License