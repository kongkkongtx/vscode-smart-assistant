"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const ChatInterface = () => {
    const [inputText, setInputText] = (0, react_1.useState)('');
    const [messages, setMessages] = (0, react_1.useState)([
        { id: 1, text: '您好！我是智能助手，有什么可以帮助您的吗？', sender: 'ai', timestamp: new Date() }
    ]);
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const messagesEndRef = (0, react_1.useRef)(null);
    // 自动滚动到底部
    (0, react_1.useEffect)(() => {
        scrollToBottom();
    }, [messages]);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!inputText.trim() || isLoading)
            return;
        // 添加用户消息
        const userMessage = {
            id: Date.now(),
            text: inputText,
            sender: 'user',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);
        // 在真实的实现中，这里会调用VS Code扩展API来获取AI响应
        // 现在我们模拟一个延迟响应
        setTimeout(() => {
            const aiResponse = {
                id: Date.now() + 1,
                text: `这是对您问题"${inputText}"的模拟回答。实际开发中，这里会调用AI模型API获取真实响应。`,
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiResponse]);
            setIsLoading(false);
        }, 1000);
    };
    // 尝试从VS Code环境中获取API
    const postToVSCode = (message) => {
        try {
            // @ts-ignore
            const vscode = acquireVsCodeApi ? acquireVsCodeApi() : null;
            if (vscode) {
                vscode.postMessage(message);
            }
            else {
                console.log('在VS Code环境外运行，消息未发送:', message);
            }
        }
        catch (e) {
            console.error('发送消息到VS Code失败:', e);
        }
    };
    return (react_1.default.createElement("div", { className: "chat-interface" },
        react_1.default.createElement("div", { className: "chat-messages" },
            messages.map((msg) => (react_1.default.createElement("div", { key: msg.id, className: `message ${msg.sender === 'user' ? 'user-message' : 'ai-message'}` },
                react_1.default.createElement("div", { className: "message-content" },
                    react_1.default.createElement("strong", null, msg.sender === 'user' ? '您:' : '智能助手:'),
                    react_1.default.createElement("div", null, msg.text),
                    react_1.default.createElement("small", { className: "timestamp" }, msg.timestamp.toLocaleTimeString()))))),
            isLoading && (react_1.default.createElement("div", { className: "message ai-message" },
                react_1.default.createElement("div", { className: "message-content" },
                    react_1.default.createElement("strong", null, "\u667A\u80FD\u52A9\u624B:"),
                    react_1.default.createElement("div", null, "\u6B63\u5728\u601D\u8003...")))),
            react_1.default.createElement("div", { ref: messagesEndRef })),
        react_1.default.createElement("form", { onSubmit: handleSubmit, className: "chat-input-form" },
            react_1.default.createElement("input", { type: "text", value: inputText, onChange: (e) => setInputText(e.target.value), placeholder: "\u8F93\u5165\u60A8\u7684\u95EE\u9898...", disabled: isLoading, className: "chat-input" }),
            react_1.default.createElement("button", { type: "submit", disabled: !inputText.trim() || isLoading, className: "send-button" }, "\u53D1\u9001"))));
};
exports.default = ChatInterface;
//# sourceMappingURL=ChatInterface.js.map