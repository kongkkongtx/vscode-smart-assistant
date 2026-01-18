import React, { useState, useEffect } from 'react';
import '../model-config.css';

interface ModelConfigPanelProps {
  onSave: (config: any) => void;
  onCancel: () => void;
  initialConfig: any;
}

const ModelConfigPanel: React.FC<ModelConfigPanelProps> = ({ onSave, onCancel, initialConfig }) => {
  const [config, setConfig] = useState({
    deepseekToken: initialConfig?.models?.deepseek || '',
    openaiToken: initialConfig?.models?.openai || '',
    claudeToken: initialConfig?.models?.claude || '',
    kimiToken: initialConfig?.models?.kimi || '',
    openrouterToken: initialConfig?.models?.openrouter || '',
    selectedModel: initialConfig?.selectedModel || 'deepseek-chat'
  });

  const handleChange = (field: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    onSave(config);
  };

  const providers = [
    { id: 'deepseek', name: 'DeepSeek', icon: '🔍', tokenField: 'deepseekToken', models: ['deepseek-chat', 'deepseek-reasoner'] },
    { id: 'openai', name: 'OpenAI', icon: '🤖', tokenField: 'openaiToken', models: ['gpt-4o', 'gpt-4-turbo'] },
    { id: 'anthropic', name: 'Anthropic Claude', icon: '🦾', tokenField: 'claudeToken', models: ['claude-3-sonnet', 'claude-3-opus'] },
    { id: 'kimi', name: 'Kimi', icon: '🌙', tokenField: 'kimiToken', models: ['kimi'] },
    { id: 'openrouter', name: 'OpenRouter', icon: '🌐', tokenField: 'openrouterToken', models: ['openrouter-model'] }
  ];

  return React.createElement('div', { className: 'model-config-panel' },
    React.createElement('h2', null, 'AI模型配置'),
    providers.map(provider => 
      React.createElement('div', { key: provider.id, className: 'provider-section' },
        React.createElement('h3', null, 
          React.createElement('span', { className: 'provider-icon' }, provider.icon),
          ' ',
          provider.name
        ),
        React.createElement('div', { className: 'token-input' },
          React.createElement('label', null, 'API Token:'),
          React.createElement('input',
            {
              type: 'password',
              value: (config as any)[provider.tokenField],
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleChange(provider.tokenField, e.target.value),
              placeholder: `输入${provider.name} API Token`,
              className: 'token-input-field'
            }
          )
        ),
        React.createElement('div', { className: 'model-selection' },
          React.createElement('label', null, '选择模型:'),
          React.createElement('select',
            {
              value: config.selectedModel,
              onChange: (e: React.ChangeEvent<HTMLSelectElement>) => handleChange('selectedModel', e.target.value),
              className: 'model-select'
            },
            provider.models.map((model: string) => 
              React.createElement('option', { key: model, value: model }, model)
            )
          )
        )
      )
    ),
    React.createElement('div', { className: 'config-actions' },
      React.createElement('button',
        {
          onClick: handleSave,
          className: 'save-button'
        },
        '保存配置'
      ),
      React.createElement('button',
        {
          onClick: onCancel,
          className: 'cancel-button'
        },
        '取消'
      )
    )
  );
};

export default ModelConfigPanel;