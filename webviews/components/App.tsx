import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import MainLayout from './MainLayout';
import ModelConfigPanel from './ModelConfigPanel';

let vscodeApi: any = null;

try {
  // @ts-ignore
  vscodeApi = acquireVsCodeApi ? acquireVsCodeApi() : null;
} catch (e) {
  console.log('非VS Code环境:', e);
}

const App = () => {
  const [isVsCodeEnv, setIsVsCodeEnv] = useState(!!vscodeApi);
  const [messages, setMessages] = useState<{command: string, data: any}[]>([]);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<any>(null);

  useEffect(() => {
    // 检测是否在VS Code环境中
    if (!vscodeApi) {
      setIsVsCodeEnv(false);
      return;
    }
    
    // 监听消息处理器
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      
      switch (message.command) {
        case 'configReceived':
          console.log('收到配置:', message.config);
          setCurrentConfig(message.config);
          break;
        case 'answerReceived':
          console.log('AI回复:', message.text);
          break;
        case 'error':
          console.error('错误:', message.text);
          break;
        case 'modelListReceived':
          console.log('收到模型列表:', message.models);
          break;
      }
      
      // 将消息添加到状态中，供子组件使用
      setMessages(prev => [...prev, { command: message.command, data: message }]);
    };
    
    window.addEventListener('message', handleMessage);
    
    // 请求初始配置
    if (vscodeApi) {
      vscodeApi.postMessage({ command: 'getConfig' });
      vscodeApi.postMessage({ command: 'getModelList' });
    }
    
    // 清理函数
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const openConfigPanel = (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡
    // 请求当前配置
    if (vscodeApi) {
      vscodeApi.postMessage({ command: 'getConfig' });
      // 使用setTimeout确保配置数据已接收
      setTimeout(() => {
        setShowConfigPanel(true);
      }, 100);
    }
  };

  const saveConfig = (config: any) => {
    if (vscodeApi) {
      vscodeApi.postMessage({ 
        command: 'updateConfig', 
        config: config 
      });
    }
    setShowConfigPanel(false);
  };

  const cancelConfig = () => {
    setShowConfigPanel(false);
  };

  return React.createElement('div', { className: 'app-container' },
    React.createElement('div', null,
      React.createElement('header', { className: 'app-header' },
        React.createElement('h1', null, 
          React.createElement('button', {
            onClick: openConfigPanel,
            className: 'config-button'
          }, '⚙️'), 
          ' VS Code 智能助手'
        )
      ),
      React.createElement('main', null,
        React.createElement(MainLayout, { messages, vscodeApi })
      )
    ),
    // 配置面板作为覆盖层显示
    showConfigPanel && React.createElement('div', { 
      className: 'config-overlay',
      onClick: (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
          setShowConfigPanel(false);
        }
      }
    },
      React.createElement('div', { className: 'config-modal' },
        React.createElement(ModelConfigPanel, { 
          onSave: saveConfig, 
          onCancel: cancelConfig, 
          initialConfig: currentConfig 
        })
      )
    )
  );
};

export default App;