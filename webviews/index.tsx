import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';

// 全局注册highlight.js，以便在dangerouslySetInnerHTML中使用
(window as any).hljs = hljs;

// 获取根元素并渲染应用
const container = document.getElementById('root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(React.createElement(App));
}