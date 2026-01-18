import React, { useState, useEffect } from 'react';

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

interface HistoryPanelProps {
  sessions: ChatSession[];
  onSelectSession: (session: ChatSession) => void;
  onCreateNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({
  sessions,
  onSelectSession,
  onCreateNewSession,
  onDeleteSession
}) => {
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  const toggleExpand = (sessionId: string) => {
    setExpandedSessionId(expandedSessionId === sessionId ? null : sessionId);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className="history-panel">
      <div className="history-header">
        <h3>历史对话</h3>
        <button className="new-session-btn" onClick={onCreateNewSession}>
          + 新建对话
        </button>
      </div>
      
      <div className="history-list">
        {sessions.length === 0 ? (
          <div className="empty-history">暂无历史对话</div>
        ) : (
          sessions.map(session => (
            <div key={session.id} className="history-item">
              <div 
                className="history-summary"
                onClick={() => onSelectSession(session)}
              >
                <div className="session-title" title={session.title}>
                  {truncateText(session.title, 30)}
                </div>
                <div className="session-meta">
                  <span className="session-date">{formatDate(new Date(session.updatedAt))}</span>
                  <span className="message-count">{session.messages.length} 条消息</span>
                </div>
                <div className="session-actions">
                  <button 
                    className="expand-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(session.id);
                    }}
                  >
                    {expandedSessionId === session.id ? '▲' : '▼'}
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
              
              {expandedSessionId === session.id && (
                <div className="session-preview">
                  {session.messages.slice(0, 3).map((message, idx) => (
                    <div key={`${session.id}-preview-${idx}`} className={`preview-message ${message.sender}`}>
                      <div className="preview-sender">
                        {message.sender === 'user' ? '👤 用户:' : '🤖 助手:'}
                      </div>
                      <div className="preview-text" title={message.text}>
                        {truncateText(message.text, 80)}
                      </div>
                    </div>
                  ))}
                  {session.messages.length > 3 && (
                    <div className="more-messages">... 还有 {session.messages.length - 3} 条消息</div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;