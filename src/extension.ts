import * as vscode from 'vscode';
import { SmartAssistantPanel } from './panels/smartAssistantPanel';

export function activate(context: vscode.ExtensionContext) {
	console.log('VS Code智能助手插件已激活');

	// 注册命令，用于打开聊天面板
	const disposable = vscode.commands.registerCommand('smartAssistant.openChatPanel', () => {
		SmartAssistantPanel.createOrShow(context);
	});

	context.subscriptions.push(disposable);

	// TODO: 添加其他初始化代码
}

export function deactivate() {
	console.log('VS Code智能助手插件已停止');
}