import React, { useState, useEffect } from 'react';
import ChatInterface from './ChatInterface';
import HistoryPanel from './HistoryPanel';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isTyping?: boolean;
  modelUsed?: string;
}

interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages: ChatMessage[];
}

interface MainLayoutProps {
  messages: {command: string, data: any}[];
  vscodeApi?: any;
}

const MainLayout: React.FC<MainLayoutProps> = ({ messages, vscodeApi }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false); // 默认隐藏侧边栏

  // 从本地存储加载历史会话
  useEffect(() => {
    if (vscodeApi) {
      // 监听来自VSCode扩展的消息
      const handleMessage = (event: MessageEvent) => {
        const message = event.data;
        switch (message.command) {
          case 'sessionsLoaded':
            try {
              const loadedSessions = message.sessions.map((s: any) => ({
                ...s,
                createdAt: new Date(s.createdAt),
                updatedAt: new Date(s.updatedAt),
                messages: s.messages.map((m: any) => ({
                  ...m,
                  timestamp: new Date(m.timestamp)
                }))
              }));
              setSessions(loadedSessions);
              if (loadedSessions.length > 0 && !activeSession) {
                setActiveSession(loadedSessions[0]);
              }
            } catch (error) {
              console.error('解析会话数据失败:', error);
            }
            break;
          case 'sessionsLoadError':
            console.error('加载会话历史失败:', message.error);
            break;
        }
      };

      window.addEventListener('message', handleMessage);
      // 请求加载会话
      vscodeApi.postMessage({ command: 'loadSessions' });

      return () => {
        window.removeEventListener('message', handleMessage);
      };
    } else {
      // 非VS Code环境下的模拟数据
      loadSessionsFromLocalStorage();
    }
  }, []);

  // 非VS Code环境下的加载函数
  const loadSessionsFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem('chatSessions');
      if (stored) {
        const parsed = JSON.parse(stored);
        const loadedSessions = parsed.map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
          messages: s.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }))
        }));
        setSessions(loadedSessions);
        if (loadedSessions.length > 0 && !activeSession) {
          setActiveSession(loadedSessions[0]);
        }
      }
    } catch (error) {
      console.error('加载会话历史失败:', error);
    }
  };

  // 保存会话到存储
  const saveSessionsToStorage = (updatedSessions: ChatSession[]) => {
    try {
      if (vscodeApi) {
        vscodeApi.postMessage({ 
          command: 'saveSessions', 
          sessions: updatedSessions 
        });
      } else {
        // 非VS Code环境下使用localStorage
        const serializableSessions = updatedSessions.map(session => ({
          ...session,
          createdAt: session.createdAt.toISOString(),
          updatedAt: session.updatedAt.toISOString(),
          messages: session.messages.map(message => ({
            ...message,
            timestamp: message.timestamp.toISOString()
          }))
        }));
        localStorage.setItem('chatSessions', JSON.stringify(serializableSessions));
      }
    } catch (error) {
      console.error('保存会话历史失败:', error);
    }
  };

  // 创建新会话
  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: '新对话',
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: []
    };
    
    const updatedSessions = [newSession, ...sessions];
    setSessions(updatedSessions);
    setActiveSession(newSession);
    saveSessionsToStorage(updatedSessions);
    
    // 通知ChatInterface重置消息
    if (vscodeApi) {
      vscodeApi.postMessage({ command: 'resetChat' });
    }
    
    // 关闭侧边栏
    setShowHistoryPanel(false);
  };

  // 选择会话
  const selectSession = (session: ChatSession) => {
    setActiveSession(session);
    setShowHistoryPanel(false); // 选择会话后关闭侧边栏
  };

  // 删除会话
  const deleteSession = (sessionId: string) => {
    const updatedSessions = sessions.filter(session => session.id !== sessionId);
    setSessions(updatedSessions);
    
    if (activeSession && activeSession.id === sessionId) {
      setActiveSession(updatedSessions.length > 0 ? updatedSessions[0] : null);
    }
    
    saveSessionsToStorage(updatedSessions);
  };

  // 更新活跃会话的消息
  const updateActiveSessionMessages = (updatedMessages: any[]) => {
    if (!activeSession) return;

    // 更新活跃会话的消息
    const updatedSession = {
      ...activeSession,
      messages: updatedMessages,
      updatedAt: new Date(),
      // 如果还没有标题，使用第一条消息作为标题
      title: activeSession.title === '新对话' && updatedMessages.length > 0 
        ? updatedMessages[0].text.substring(0, 30) + (updatedMessages[0].text.length > 30 ? '...' : '') 
        : activeSession.title
    };

    // 更新会话列表
    const updatedSessions = sessions.map(session => 
      session.id === activeSession.id ? updatedSession : session
    );
    
    if (!sessions.some(s => s.id === updatedSession.id)) {
      // 如果会话不在列表中（新创建的），添加到列表开头
      updatedSessions.unshift(updatedSession);
    }

    setSessions(updatedSessions);
    setActiveSession(updatedSession);
    saveSessionsToStorage(updatedSessions);
  };

  // 初始化第一个会话（如果没有会话的话）
  useEffect(() => {
    if (sessions.length === 0 && !activeSession) {
      createNewSession();
    }
  }, []);

  // 处理点击外部区域关闭侧边栏
  const handleClickOutside = (e: MouseEvent) => {
    // 检查点击的元素是否在侧边栏或触发按钮之外
    const target = e.target as HTMLElement;
    const sidebar = document.querySelector('.history-sidebar');
    const toggleBtn = document.querySelector('.toggle-history-btn');
    
    if (showHistoryPanel && 
        sidebar && 
        !sidebar.contains(target) && 
        toggleBtn && 
        !toggleBtn.contains(target) &&
        !target.classList.contains('chat-overlay')) {
      // 如果点击的是其他区域（非遮罩、非侧边栏、非按钮），关闭侧边栏
      setShowHistoryPanel(false);
    }
  };

  // 监听全局点击事件
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showHistoryPanel]);

  return (
    <div className="main-layout">
      {/* 历史对话侧边栏 */}
      <div className={`history-sidebar ${showHistoryPanel ? 'visible' : ''}`}>
        <HistoryPanel
          sessions={sessions}
          onSelectSession={selectSession}
          onCreateNewSession={createNewSession}
          onDeleteSession={deleteSession}
        />
      </div>

      {/* 遮罩层 */}
      <div 
        className={`chat-overlay ${showHistoryPanel ? 'visible' : ''}`}
        onClick={(e) => {
          // 防止事件冒泡，确保点击遮罩时一定关闭侧边栏
          e.stopPropagation();
          setShowHistoryPanel(false);
        }}
      />

      {/* 主聊天区域 */}
      <div className={`chat-area ${showHistoryPanel ? 'with-sidebar' : ''}`}>
        <div className="chat-header">
          <button 
            className="toggle-history-btn"
            onClick={(e) => {
              e.stopPropagation(); // 防止事件冒泡
              setShowHistoryPanel(!showHistoryPanel);
            }}
          >
            {showHistoryPanel ? '◀' : '☰'}
          </button>
          <div className="session-title">
            {activeSession ? activeSession.title : '选择一个对话或创建新对话'}
          </div>
          <button 
            className="new-session-btn-header"
            onClick={createNewSession}
            title="新建对话"
          >
            +
          </button>
        </div>
        
        <div className="chat-content">
          {activeSession ? (
            <ChatInterface 
              messages={messages} 
              vscodeApi={vscodeApi}
              currentSession={activeSession}
              onUpdateMessages={updateActiveSessionMessages}
            />
          ) : (
            <div className="no-session-selected">
              <p>请选择一个历史对话或创建新对话</p>
              <button onClick={createNewSession}>创建新对话</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;