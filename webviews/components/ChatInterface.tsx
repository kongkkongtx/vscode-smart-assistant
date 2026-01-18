import React from 'react';
import { useState, useRef, useEffect } from 'react';

interface ChatInterfaceProps {
  messages: {command: string, data: any}[];
  vscodeApi?: any;
  currentSession?: {
    id: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
    messages: any[];
  };
  onUpdateMessages?: (updatedMessages: any[]) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, vscodeApi, currentSession, onUpdateMessages }) => {
  const [inputText, setInputText] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);

  // 当 currentSession 变化时，更新聊天消息
  useEffect(() => {
    if (currentSession) {
      setChatMessages(currentSession.messages.length > 0 
        ? currentSession.messages 
        : [{ id: 1, text: '你好，我是智能助手，有什么可以帮助你的吗？', sender: 'ai', timestamp: new Date(), isTyping: false, modelUsed: 'deepseek-chat' }]);
    }
  }, [currentSession]);

  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('deepseek-chat');
  const [currentModel, setCurrentModel] = useState('deepseek-chat');
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // 处理来自父组件传递的消息
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      switch (lastMessage.command) {
        case 'answerReceived':
          // 开始优化的打字机效果显示AI响应
          const aiResponse = {
            id: lastMessage.data.id,
            text: '', // 初始为空，后面逐字填充
            sender: 'ai',
            timestamp: new Date(),
            isTyping: true, // 标记为正在打字
            modelUsed: currentModel // 记录此AI回复使用的模型
          };
          
          // 先添加一个空消息，然后逐步显示内容
          setChatMessages(prev => {
            // 移除之前的"正在思考..."消息
            const updatedMessages = prev.filter(msg => !(msg.sender === 'ai' && msg.text === '正在思考...'));
            const newMessages = [...updatedMessages, aiResponse];
            // 同步更新到父组件
            if (onUpdateMessages) {
              onUpdateMessages(newMessages);
            }
            return newMessages;
          });

          // 实现优化的打字机效果，针对不同内容类型使用不同速度
          const fullText = lastMessage.data.text;
          
          // 分析文本内容，区分代码块和普通文本
          const segments = parseTextSegments(fullText);
          
          let currentText = '';
          let segmentIndex = 0;
          
          const processNextSegment = () => {
            if (segmentIndex >= segments.length) {
              // 所有段落已完成
              setChatMessages(prev => {
                const updatedMessages = prev.map(msg => {
                  if (msg.id === lastMessage.data.id) {
                    return { ...msg, isTyping: false }; // 停止打字状态
                  }
                  return msg;
                });
                // 同步更新到父组件
                if (onUpdateMessages) {
                  onUpdateMessages(updatedMessages);
                }
                return updatedMessages;
              });
              setIsLoading(false);
              return;
            }
            
            const segment = segments[segmentIndex];
            let charIndex = 0;
            
            const typeSegment = () => {
              if (charIndex < segment.text.length) {
                currentText += segment.text[charIndex];
                charIndex++;
                
                setChatMessages(prev => {
                  const updatedMessages = prev.map(msg => {
                    if (msg.id === lastMessage.data.id) {
                      return { ...msg, text: currentText };
                    }
                    return msg;
                  });
                  // 同步更新到父组件
                  if (onUpdateMessages) {
                    onUpdateMessages(updatedMessages);
                  }
                  return updatedMessages;
                });
                
                // 根据段落类型设置不同的打字速度
                const delay = segment.type === 'code' ? 5 : 30; // 代码块更快，普通文本较慢
                setTimeout(typeSegment, delay);
              } else {
                // 当前段落已完成，处理下一个段落
                segmentIndex++;
                setTimeout(processNextSegment, 300); // 段落间停顿
              }
            };
            
            typeSegment();
          };
          
          processNextSegment();
          break;
        case 'error':
          // 收到错误信息，移除加载状态并添加错误信息
          setChatMessages(prev => {
            // 移除"正在思考..."消息
            const updatedMessages = prev.filter(msg => !(msg.sender === 'ai' && msg.text === '正在思考...'));
            const errorResponse = {
              id: Date.now(),
              text: lastMessage.data.text,
              sender: 'ai',
              timestamp: new Date(),
              isTyping: false,
              modelUsed: currentModel // 记录此AI回复使用的模型
            };
            const newMessages = [...updatedMessages, errorResponse];
            // 同步更新到父组件
            if (onUpdateMessages) {
              onUpdateMessages(newMessages);
            }
            return newMessages;
          });
          setIsLoading(false);
          break;
        case 'configReceived':
          // 配置信息接收处理
          console.log('收到配置信息:', lastMessage.data.config);
          setSelectedModel(lastMessage.data.config.selectedModel);
          break;
        case 'modelListReceived':
          // 可用模型列表接收处理
          setAvailableModels(lastMessage.data.models);
          break;
        case 'resetChat':
          // 重置聊天消息
          setChatMessages([]);
          if (onUpdateMessages) {
            onUpdateMessages([]);
          }
          break;

      }
    }
  }, [messages]);

  // 请求模型列表
  useEffect(() => {
    if (vscodeApi) {
      vscodeApi.postMessage({ command: 'getModelList' });
    }
  }, [vscodeApi]);

  // 解析文本为不同类型的段落（普通文本、代码块等）
  const parseTextSegments = (text: string) => {
    const segments: { text: string, type: 'normal' | 'code' }[] = [];
    const codeBlockRegex = /(```[\s\S]*?```)/g;
    const parts = text.split(codeBlockRegex);
    
    parts.forEach(part => {
      if (part.startsWith('```') && part.endsWith('```')) {
        segments.push({ text: part, type: 'code' });
      } else if (part.trim()) {
        segments.push({ text: part, type: 'normal' });
      }
    });
    
    return segments;
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    // 添加用户消息
    const userMessage = {
      id: Date.now(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
      isTyping: false
    };

    setChatMessages(prev => {
      const newMessages = [...prev, userMessage];
      // 同步更新到父组件
      if (onUpdateMessages) {
        onUpdateMessages(newMessages);
      }
      return newMessages;
    });
    setInputText('');
    
    // 显示"正在思考..."消息
    const loadingMessage = {
      id: Date.now() + 1,
      text: '正在思考...',
      sender: 'ai',
      timestamp: new Date(),
      isTyping: false
    };
    setChatMessages(prev => {
      const newMessages = [...prev, loadingMessage];
      // 同步更新到父组件
      if (onUpdateMessages) {
        onUpdateMessages(newMessages);
      }
      return newMessages;
    });
    setIsLoading(true);

    // 发送消息到VS Code扩展，包含历史对话上下文
    const chatHistory = chatMessages.slice(-6); // 只发送最近的几次对话
    postToVSCode({ 
      command: 'askQuestion', 
      text: inputText,
      context: chatHistory
    });
  };

  // 模型切换处理
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value;
    
    // 无痛切换模型，不影响当前对话历史
    setCurrentModel(newModel);
    
    // 更新后端配置
    if (vscodeApi) {
      vscodeApi.postMessage({ 
        command: 'updateConfig', 
        config: { selectedModel: newModel }
      });
    }
  };

  // 发送消息到VS Code扩展API
  const postToVSCode = (message: any) => {
    if (vscodeApi) {
      vscodeApi.postMessage(message);
    } else {
      console.log('非VS Code环境中，消息未发送:', message);
    }
  };

  // 获取模型图标
  const getModelIcon = (modelId: string) => {
    switch(modelId) {
      case 'gpt-4o':
      case 'gpt-4-turbo':
        return '🤖'; // OpenAI图标
      case 'claude-3-sonnet':
      case 'claude-3-opus':
        return '🦾'; // Anthropic图标
      case 'deepseek-chat':
      case 'deepseek-reasoner':
        return '🔍'; // DeepSeek图标
      case 'kimi':
        return '🌙'; // Kimi图标
      case 'openrouter-model':
        return '🌐'; // OpenRouter图标
      default:
        return '💬'; // 默认图标
    }
  };

  // 获取模型名称
  const getModelName = (modelId: string) => {
    const model = availableModels.find(m => m.id === modelId);
    return model ? model.name : modelId;
  };

  // 渲染消息内容，支持 Markdown 格式化
  const renderMessageContent = (text: string) => {
    // 简单的 Markdown 解析，将代码块、标题等转换为 HTML
    let formattedText = text
      // 处理代码块，移除头部，保留内容
      .replace(/```([\s\S]*?)```/g, (match, code) => {
        // 获取语言标识
        const firstLine = match.split('\n')[0];
        const language = firstLine.replace('```', '').trim() || 'text';
        const cleanCode = match.replace(/```.*\n?/, '').replace(/```$/, '');
        
        // 使用highlight.js进行语法高亮
        const highlightedCode = (window as any).hljs ? 
          (window as any).hljs.highlight(cleanCode, { language: language }).value : 
          escapeHtml(cleanCode);
        
        // 构建代码块 HTML
        return `
          <div class="code-block">
            <div class="code-header">
              <span class="code-lang">${language}</span>
              <button class="copy-btn" onclick="copyCode('${encodeURIComponent(cleanCode)}')">复制</button>
            </div>
            <pre><code class="language-${language}" data-language="${language}">${highlightedCode}</code></pre>
          </div>
        `;
      })
      // 处理粗体
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // 处理斜体
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // 处理标题
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      // 处理换行
      .replace(/\n/g, '<br>');
    
    return React.createElement('div', {
      dangerouslySetInnerHTML: { __html: formattedText }
    });
  };

  // 转义HTML特殊字符
  const escapeHtml = (unsafe: string) => {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  // 在组件挂载时添加全局复制函数
  useEffect(() => {
    (window as any).copyCode = (encodedCode: string) => {
      const decodedCode = decodeURIComponent(encodedCode);
      navigator.clipboard.writeText(decodedCode).then(() => {
        console.log('代码已复制到剪贴板');
        // 创建临时提示元素
        const tip = document.createElement('div');
        tip.textContent = '已复制!';
        tip.style.position = 'fixed';
        tip.style.top = '50%';
        tip.style.left = '50%';
        tip.style.transform = 'translate(-50%, -50%)';
        tip.style.backgroundColor = '#4CAF50';
        tip.style.color = 'white';
        tip.style.padding = '8px 16px';
        tip.style.borderRadius = '4px';
        tip.style.zIndex = '1000';
        tip.style.fontSize = '14px';
        
        document.body.appendChild(tip);
        
        setTimeout(() => {
          document.body.removeChild(tip);
        }, 2000);
      }).catch(err => {
        console.error('复制失败:', err);
      });
    };

    return () => {
      delete (window as any).copyCode;
    };
  }, []);

  return React.createElement('div', { className: 'chat-interface' },
    React.createElement('div', { className: 'chat-messages' },
      chatMessages.map((msg) => 
        React.createElement('div', 
          { 
            key: msg.id,
            className: 'message ' + (msg.sender === 'user' ? 'user-message' : 'ai-message')
          },
          React.createElement('div', { className: 'message-content' },
            React.createElement('div', { className: 'message-header' },
              React.createElement('strong', null, msg.sender === 'user' ? '用户:' : '智能助手:'),
              msg.sender === 'ai' && React.createElement('span', { className: 'model-info' },
                `(${getModelName(msg.modelUsed || selectedModel)})`
              )
            ),
            renderMessageContent(msg.text),
            React.createElement('small', { className: 'timestamp' }, msg.timestamp.toLocaleTimeString())
          )
        )
      ),
      React.createElement('div', { ref: messagesEndRef })
    ),
    React.createElement('div', { className: 'input-area' },
      React.createElement('div', { className: 'input-controls' },
        React.createElement('div', { className: 'model-selector' },
          React.createElement('select',
            {
              value: selectedModel,
              onChange: handleModelChange,
              className: 'model-select'
            },
            availableModels.map((model: any) =>
              React.createElement('option', 
                { key: model.id, value: model.id },
                `${getModelIcon(model.id)} ${model.name} (${model.provider})`
              )
            )
          )
        ),
        React.createElement('div', { className: 'send-button-container' },
          React.createElement('button',
            {
              type: 'submit',
              disabled: !inputText.trim() || isLoading,
              className: 'send-button'
            },
            '发送'
          )
        )
      ),
      React.createElement('div', { className: 'chat-input-form' },
        React.createElement('form', { onSubmit: handleSubmit },
          React.createElement('textarea',
            {
              value: inputText,
              onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setInputText(e.target.value),
              placeholder: '请输入您的问题...',
              disabled: isLoading,
              className: 'chat-input',
              rows: 1,
              onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (!isLoading && inputText.trim()) {
                    handleSubmit(e as React.FormEvent);
                  }
                }
              },
              onInput: (e: React.FormEvent<HTMLTextAreaElement>) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                
                // 如果滚动高度超过了最大高度，则固定高度并启用滚动条
                if (target.scrollHeight > 150) {
                  target.style.height = '150px';
                  target.style.overflowY = 'scroll';
                } else {
                  // 否则让高度自适应内容
                  target.style.height = target.scrollHeight + 'px';
                  target.style.overflowY = 'hidden';
                }
              }
            }
          )
        )
      )
    )
  );
};

export default ChatInterface;