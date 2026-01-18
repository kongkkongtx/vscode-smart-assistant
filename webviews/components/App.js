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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const ChatInterface_1 = __importDefault(require("./ChatInterface"));
const App = () => {
    const [isVsCodeEnv, setIsVsCodeEnv] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        // 检查是否在VS Code环境中运行
        try {
            // @ts-ignore
            const vscode = acquireVsCodeApi ? acquireVsCodeApi() : null;
            setIsVsCodeEnv(!!vscode);
            // 设置消息监听器
            window.addEventListener('message', event => {
                const message = event.data;
                switch (message.command) {
                    case 'configReceived':
                        console.log('收到配置:', message.config);
                        break;
                    case 'answerReceived':
                        // 在实际应用中，这会更新聊天历史
                        console.log('AI回答:', message.text);
                        break;
                    case 'error':
                        console.error('错误:', message.text);
                        break;
                }
            });
            // 请求初始配置
            if (vscode) {
                vscode.postMessage({ command: 'getConfig' });
            }
        }
        catch (e) {
            console.log('非VS Code环境:', e);
            setIsVsCodeEnv(false);
        }
    }, []);
    return (react_1.default.createElement("div", { className: "app-container" },
        react_1.default.createElement("header", { className: "app-header" },
            react_1.default.createElement("h1", null, "VS Code \u667A\u80FD\u52A9\u624B")),
        react_1.default.createElement("main", null,
            react_1.default.createElement(ChatInterface_1.default, null))));
};
exports.default = App;
//# sourceMappingURL=App.js.map