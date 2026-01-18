import axios from 'axios';

interface ApiConfig {
  token: string;
  model: string;
  provider: string; // 新增：模型提供商
}

interface Message {
  role: string;
  content: string;
}

export class ApiService {
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = config;
  }

  async sendMessage(prompt: string, messages?: Message[]): Promise<string> {
    console.log('开始发送API请求:', { 
      prompt, 
      model: this.config.model, 
      provider: this.config.provider 
    });
    
    try {
      // 检查是否有有效的token
      if (!this.config.token) {
        throw new Error(`未配置${this.config.provider} API token，请在设置中配置`);
      }

      console.log('准备发起API调用...');
      
      // 根据提供商选择API端点
      switch (this.config.provider.toLowerCase()) {
        case 'openai':
          return await this.callOpenAIApi(messages || [{ role: 'user', content: prompt }]);
        case 'anthropic':
          return await this.callAnthropicApi(messages || [{ role: 'user', content: prompt }]);
        case 'openrouter':
          return await this.callOpenRouterApi(messages || [{ role: 'user', content: prompt }]);
        case 'kimi':
          return await this.callKimiApi(messages || [{ role: 'user', content: prompt }]);
        case 'deepseek':
        default:
          return await this.callDeepSeekApi(messages || [{ role: 'user', content: prompt }]);
      }
    } catch (error: any) {
      console.error('API调用失败:', error);
      if (error.code === 'ECONNABORTED') {
        console.error('请求超时');
        throw new Error('API请求超时（60秒），请检查网络连接或稍后重试');
      }
      if (axios.isAxiosError(error)) {
        console.error('Axios错误详情:', error.response?.status, error.response?.data);
        const errorMessage = error.response?.data?.error?.message || error.message || '未知错误';
        const statusCode = error.response?.status;
        
        if (statusCode === 401) {
          throw new Error(`API认证失败，请检查API Token是否正确: ${errorMessage}`);
        } else if (statusCode === 429) {
          throw new Error(`API请求频率超限，请稍后重试: ${errorMessage}`);
        } else if (statusCode === 404) {
          throw new Error(`API端点不存在: ${errorMessage}`);
        } else if (statusCode != null && statusCode >= 500) {
          throw new Error(`API服务器错误(${statusCode}): ${errorMessage}`);
        } else if (statusCode != null) {
          throw new Error(`API调用失败(${statusCode}): ${errorMessage}`);
        } else {
          throw new Error(`API调用失败: ${errorMessage}`);
        }
      }
      console.error('未知错误:', error.message);
      throw new Error(`请求失败: ${error.message}`);
    }
  }

  private async callDeepSeekApi(messages: Message[]): Promise<string> {
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: this.config.model,
        messages: messages,
        stream: false,
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 60000
      }
    );

    if(response.data && response.data.choices && response.data.choices.length > 0) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error('API响应格式异常：缺少有效内容');
    }
  }

  private async callOpenAIApi(messages: Message[]): Promise<string> {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: this.config.model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );

    if(response.data && response.data.choices && response.data.choices.length > 0) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error('API响应格式异常：缺少有效内容');
    }
  }

  private async callAnthropicApi(messages: Message[]): Promise<string> {
    // Anthropic Claude API 使用不同的格式
    // 需要将消息转换为Anthropic格式
    const systemMessage = messages.filter(msg => msg.role === 'system').map(msg => msg.content).join('\n');
    const userMessages = messages.filter(msg => msg.role !== 'system');

    // Anthropic API 需要交替的 human 和 assistant 消息
    let combinedContent = '';
    for (const msg of userMessages) {
      if (msg.role === 'user') {
        combinedContent += `\n\nHuman: ${msg.content}`;
      } else if (msg.role === 'assistant') {
        combinedContent += `\n\nAssistant: ${msg.content}`;
      }
    }
    combinedContent += '\n\nAssistant:';

    const response = await axios.post(
      'https://api.anthropic.com/v1/complete',
      {
        prompt: combinedContent,
        model: this.config.model,
        max_tokens_to_sample: 1000,
        temperature: 0.7,
        stop_sequences: ["\n\nHuman:"]
      },
      {
        headers: {
          'x-api-key': `${this.config.token}`,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        timeout: 60000
      }
    );

    if(response.data && response.data.completion) {
      return response.data.completion.trim();
    } else {
      throw new Error('API响应格式异常：缺少有效内容');
    }
  }

  private async callOpenRouterApi(messages: Message[]): Promise<string> {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: this.config.model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/your-app', // 替换为实际的引用地址
          'X-Title': 'VS Code Smart Assistant' // 替换为实际的应用名
        },
        timeout: 60000
      }
    );

    if(response.data && response.data.choices && response.data.choices.length > 0) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error('API响应格式异常：缺少有效内容');
    }
  }

  private async callKimiApi(messages: Message[]): Promise<string> {
    // Kimi API 的调用方式（这里提供一个通用的结构，实际API可能需要调整）
    const response = await axios.post(
      'https://api.moonshot.cn/v1/chat/completions', // 示例API端点，实际可能不同
      {
        model: this.config.model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );

    if(response.data && response.data.choices && response.data.choices.length > 0) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error('API响应格式异常：缺少有效内容');
    }
  }

  updateConfig(newConfig: ApiConfig) {
    this.config = newConfig;
  }
}