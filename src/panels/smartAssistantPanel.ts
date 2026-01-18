import * as vscode from 'vscode';
import { ApiService } from '../utils/apiService';

export class SmartAssistantPanel {
	private static readonly viewType = 'smartAssistant.chatPanel';
	private static panel: vscode.WebviewPanel | undefined;
	private static extensionUri: vscode.Uri;
	private static apiService: ApiService | null = null;

	public static createOrShow(context: vscode.ExtensionContext) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// 如果面板已经存在，则将其聚焦
		if (SmartAssistantPanel.panel) {
			SmartAssistantPanel.panel.reveal(column);
			return;
		}

		// 否则，创建一个新的面板
		SmartAssistantPanel.extensionUri = context.extensionUri;
		SmartAssistantPanel.panel = vscode.window.createWebviewPanel(
			SmartAssistantPanel.viewType,
			'智能助手',
			column || vscode.ViewColumn.One,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [
					vscode.Uri.joinPath(context.extensionUri, 'webviews'),
					vscode.Uri.joinPath(context.extensionUri, 'out')
				]
			}
		);

		SmartAssistantPanel.panel.webview.html = SmartAssistantPanel.getWebviewContent(
			SmartAssistantPanel.panel.webview,
			context
		);

		// 初始化API服务
		SmartAssistantPanel.initApiService();

		// 当面板被处置时，清理变量
		SmartAssistantPanel.panel.onDidDispose(() => {
			SmartAssistantPanel.panel = undefined;
		}, null, context.subscriptions);

		// 处理来自Webview的消息
		SmartAssistantPanel.panel.webview.onDidReceiveMessage(async (message) => {
			switch (message.command) {
				case 'askQuestion':
					// 这里处理向AI提问的逻辑
					await SmartAssistantPanel.handleAskQuestion(message.text, SmartAssistantPanel.panel!.webview, message.context);
					return;
				case 'getConfig':
					// 返回当前配置给前端
					SmartAssistantPanel.sendConfig(SmartAssistantPanel.panel!.webview);
					return;
				case 'updateConfig':
					// 更新配置
					SmartAssistantPanel.updateConfig(message.config);
					return;
				case 'getModelList':
					// 返回可用模型列表
					SmartAssistantPanel.sendModelList(SmartAssistantPanel.panel!.webview);
					return;
        case 'loadSessions':
          // 加载会话历史
          SmartAssistantPanel.loadSessions(SmartAssistantPanel.panel!.webview, context);
          return;
        case 'saveSessions':
          // 保存会话历史
          SmartAssistantPanel.saveSessions(message.sessions, context);
          return;

			}
		}, null, context.subscriptions);
	}

	private static initApiService() {
		// 获取当前选中的模型
		const selectedModel = vscode.workspace.getConfiguration().get<string>('smartAssistant.selectedModel') || 'deepseek-chat';
		
		// 根据模型名称确定提供商和获取相应的token
		let token = '';
		let provider = '';
		let model = selectedModel;

		switch(selectedModel) {
			case 'deepseek-chat':
			case 'deepseek-reasoner':
				token = vscode.workspace.getConfiguration().get<string>('smartAssistant.deepseekToken') || '';
				provider = 'deepseek';
				break;
			case 'gpt-4o':
			case 'gpt-4-turbo':
				token = vscode.workspace.getConfiguration().get<string>('smartAssistant.openaiToken') || '';
				provider = 'openai';
				break;
			case 'claude-3-sonnet':
			case 'claude-3-opus':
				token = vscode.workspace.getConfiguration().get<string>('smartAssistant.claudeToken') || '';
				provider = 'anthropic';
				break;
			case 'kimi':
				token = vscode.workspace.getConfiguration().get<string>('smartAssistant.kimiToken') || '';
				provider = 'kimi';
				model = 'moonshot-v1-8k'; // Kimi的默认模型
				break;
			case 'openrouter-model':
				token = vscode.workspace.getConfiguration().get<string>('smartAssistant.openrouterToken') || '';
				provider = 'openrouter';
				model = vscode.workspace.getConfiguration().get<string>('smartAssistant.openrouterModel') || 'openrouter/auto';
				break;
			default:
				// 默认使用DeepSeek
				token = vscode.workspace.getConfiguration().get<string>('smartAssistant.deepseekToken') || '';
				provider = 'deepseek';
		}
		
		console.log('初始化API服务:', { 
			model: selectedModel, 
			provider,
			hasToken: !!token 
		});
		
		if (!token) {
			vscode.window.showWarningMessage(`未配置${provider}的API Token，请在设置中配置`);
		}
		
		SmartAssistantPanel.apiService = new ApiService({
			token,
			model,
			provider
		});
	}

	private static getWebviewContent(webview: vscode.Webview, context: vscode.ExtensionContext): string {
		const scriptUri = webview.asWebviewUri(
			vscode.Uri.joinPath(context.extensionUri, 'out', 'webview.js')
		);
		
		// 更新CSS引用到webviews/styles.css
		const styleUri = webview.asWebviewUri(
			vscode.Uri.joinPath(context.extensionUri, 'webviews', 'styles.css')
		);
		
		// 引入历史面板CSS
		const historyStyleUri = webview.asWebviewUri(
			vscode.Uri.joinPath(context.extensionUri, 'webviews', 'history-panel.css')
		);

		return `<!DOCTYPE html>
		<html lang="zh-CN">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>智能助手</title>
			<link href="${styleUri}" rel="stylesheet">
			<link href="${historyStyleUri}" rel="stylesheet">
		</head>
		<body>
			<div id="root"></div>
			<script src="${scriptUri}"></script>
		</body>
		</html>`;
	}

	private static async handleAskQuestion(question: string, webview: vscode.Webview, context?: any[]) {
		console.log('处理问题:', question);
		
		// 这里是向AI发送请求并接收响应的逻辑
		try {
			if (!SmartAssistantPanel.apiService) {
				throw new Error('API服务未初始化');
			}
			
			console.log('开始调用API服务');
			
			// 准备消息历史（如果有的话）
			let messages: { role: string; content: string }[] = [];
			
			// 如果有上下文，将其转换为API所需格式
			if (context && Array.isArray(context)) {
				// 转换历史消息，将用户消息设为'user'角色，AI消息设为'assistant'角色
				for (const msg of context) {
					if (msg.sender === 'user') {
						messages.push({
							role: 'user',
							content: msg.text
						});
					} else if (msg.sender === 'ai') {
						messages.push({
							role: 'assistant',
							content: msg.text
						});
					}
				}
			}
			
			// 添加当前问题
			messages.push({
				role: 'user',
				content: question
			});
			
			// 调用API服务获取实际响应，传递上下文信息
			const response = await SmartAssistantPanel.apiService.sendMessage(question, messages);
			
			console.log('收到API响应:', response.substring(0, 50) + '...');
			
			// 发送最终响应
			webview.postMessage({
				command: 'answerReceived',
				text: response,
				id: Date.now()
			});
		} catch (error: any) {
			console.error('处理问题时出错:', error);
			webview.postMessage({
				command: 'error',
				text: `发生错误: ${error.message}`
			});
		}
	}

	private static sendConfig(webview: vscode.Webview) {
		const config = {
			selectedModel: vscode.workspace.getConfiguration().get<string>('smartAssistant.selectedModel') || 'deepseek-chat',
			models: {
				deepseek: vscode.workspace.getConfiguration().get<string>('smartAssistant.deepseekToken') || '',
				openai: vscode.workspace.getConfiguration().get<string>('smartAssistant.openaiToken') || '',
				claude: vscode.workspace.getConfiguration().get<string>('smartAssistant.claudeToken') || '',
				kimi: vscode.workspace.getConfiguration().get<string>('smartAssistant.kimiToken') || '',
				openrouter: vscode.workspace.getConfiguration().get<string>('smartAssistant.openrouterToken') || ''
			}
		};
		
		webview.postMessage({
			command: 'configReceived',
			config: config
		});
	}

	private static sendModelList(webview: vscode.Webview) {
		const modelList = [
			{ id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'DeepSeek' },
			{ id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', provider: 'DeepSeek' },
			{ id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
			{ id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI' },
			{ id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic' },
			{ id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic' },
			{ id: 'kimi', name: 'Kimi', provider: 'Moonshot AI' },
			{ id: 'openrouter-model', name: 'OpenRouter Model', provider: 'OpenRouter' }
		];
		
		webview.postMessage({
			command: 'modelListReceived',
			models: modelList
		});
	}

	private static async updateConfig(config: { selectedModel: string, [key: string]: string }) {
		const workspaceConfig = vscode.workspace.getConfiguration();
		
		// 保存各项配置到VS Code设置
		if (config.selectedModel) {
			await workspaceConfig.update('smartAssistant.selectedModel', config.selectedModel, vscode.ConfigurationTarget.Global);
		}
		if (config.deepseekToken !== undefined) {
			await workspaceConfig.update('smartAssistant.deepseekToken', config.deepseekToken, vscode.ConfigurationTarget.Global);
		}
		if (config.openaiToken !== undefined) {
			await workspaceConfig.update('smartAssistant.openaiToken', config.openaiToken, vscode.ConfigurationTarget.Global);
		}
		if (config.claudeToken !== undefined) {
			await workspaceConfig.update('smartAssistant.claudeToken', config.claudeToken, vscode.ConfigurationTarget.Global);
		}
		if (config.kimiToken !== undefined) {
			await workspaceConfig.update('smartAssistant.kimiToken', config.kimiToken, vscode.ConfigurationTarget.Global);
		}
		if (config.openrouterToken !== undefined) {
			await workspaceConfig.update('smartAssistant.openrouterToken', config.openrouterToken, vscode.ConfigurationTarget.Global);
		}
		
		// 重新初始化API服务以应用新的配置
		SmartAssistantPanel.initApiService();
		
		// 通知前端配置已更新
		if (SmartAssistantPanel.panel && SmartAssistantPanel.panel.webview) {
			SmartAssistantPanel.sendConfig(SmartAssistantPanel.panel.webview);
		}
	}

	private static loadSessions(webview: vscode.Webview, context: vscode.ExtensionContext) {
		try {
      const sessions = context.globalState.get('chatSessions', []);
      webview.postMessage({
        command: 'sessionsLoaded',
        sessions: sessions
      });
    } catch (error) {
      console.error('加载会话历史失败:', error);
      webview.postMessage({
        command: 'sessionsLoadError',
        error: (error as Error).message
      });
    }
	}

	private static async saveSessions(sessions: any[], context: vscode.ExtensionContext) {
		try {
      await context.globalState.update('chatSessions', sessions);
    } catch (error) {
      console.error('保存会话历史失败:', error);
    }
	}
}