'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Send,
  MessageCircle,
  ChevronLeft,
  Circle,
  Search,
} from 'lucide-react';
import { useChatStore } from '@/lib/chat-store';
import { useAuthStore, useDataStore } from '@/lib/store';
import { cn, formatDistanceToNow } from '@/lib/utils';

export function ChatPanel() {
  const { currentUser } = useAuthStore();
  const users = useDataStore((s) => s.users);
  const {
    messages,
    activeConversationId,
    unreadCounts,
    isOpen,
    isLoading,
    toggleChat,
    setActiveConversation,
    loadMessages,
    sendMessage,
    markAsRead,
  } = useChatStore();

  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load messages when conversation changes
  useEffect(() => {
    if (activeConversationId && currentUser?.id) {
      loadMessages(currentUser.id, activeConversationId);
      markAsRead(activeConversationId, currentUser.id);
    }
  }, [activeConversationId, currentUser?.id, loadMessages, markAsRead]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeConversationId]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && activeConversationId) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, activeConversationId]);

  // Escape key closes chat panel
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        toggleChat();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggleChat]);

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || !currentUser || !activeConversationId) return;

    const receiver = users.find((u) => u.id === activeConversationId);
    if (!receiver) return;

    await sendMessage(
      currentUser.id,
      currentUser.name,
      receiver.id,
      receiver.name,
      inputValue.trim()
    );
    setInputValue('');
  }, [inputValue, currentUser, activeConversationId, users, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Filter out current user and inactive users
  const chatUsers = users.filter(
    (u) => u.id !== currentUser?.id && u.status === 'active'
  );

  const filteredUsers = searchQuery.trim()
    ? chatUsers.filter((u) =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : chatUsers;

  // Sort users by most recent message activity (most recent first)
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const lastMsgA = messages
      .filter(
        (m) =>
          (m.senderId === currentUser?.id && m.receiverId === a.id) ||
          (m.senderId === a.id && m.receiverId === currentUser?.id)
      )
      .slice(-1)[0];
    const lastMsgB = messages
      .filter(
        (m) =>
          (m.senderId === currentUser?.id && m.receiverId === b.id) ||
          (m.senderId === b.id && m.receiverId === currentUser?.id)
      )
      .slice(-1)[0];
    const timeA = lastMsgA ? new Date(lastMsgA.createdAt).getTime() : 0;
    const timeB = lastMsgB ? new Date(lastMsgB.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  // Get conversation messages for active user
  const conversationMessages = activeConversationId
    ? messages.filter(
        (m) =>
          (m.senderId === currentUser?.id && m.receiverId === activeConversationId) ||
          (m.senderId === activeConversationId && m.receiverId === currentUser?.id)
      )
    : [];

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-[380px] bg-[#0f1525] border-l border-[#1e2a3a] shadow-2xl z-[60] flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2a3a] bg-[#0a0e1a]/50">
        {activeConversationId ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveConversation(null)}
              className="p-1.5 rounded-lg hover:bg-[rgba(201,168,76,0.1)] text-[#94a3b8] hover:text-[#c9a84c] transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c9a84c] to-[#a88a3a] flex items-center justify-center">
                <span className="text-[#0a0e1a] font-semibold text-xs">
                  {users.find((u) => u.id === activeConversationId)?.name?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-[#f0f0f0]">
                  {users.find((u) => u.id === activeConversationId)?.name}
                </p>
                <p className="text-[10px] text-[#22c55e] flex items-center gap-1">
                  <Circle size={6} fill="currentColor" /> Online
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <MessageCircle size={18} className="text-[#c9a84c]" />
            <span className="text-sm font-semibold text-[#f0f0f0]">Messages</span>
            {totalUnread > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-[#ef4444] text-white text-[10px] font-medium">
                {totalUnread}
              </span>
            )}
          </div>
        )}
        <button
          onClick={toggleChat}
          className="p-1.5 rounded-lg hover:bg-[rgba(201,168,76,0.1)] text-[#94a3b8] hover:text-[#c9a84c] transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      {activeConversationId ? (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {isLoading && conversationMessages.length === 0 && (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {conversationMessages.map((msg) => {
              const isMe = msg.senderId === currentUser?.id;
              return (
                <div
                  key={msg.id}
                  className={cn('flex', isMe ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[80%] px-3 py-2 rounded-xl text-sm',
                      isMe
                        ? 'bg-[#c9a84c]/20 text-[#f0f0f0] rounded-br-sm'
                        : 'bg-[#1e2a3a] text-[#f0f0f0] rounded-bl-sm'
                    )}
                  >
                    <p>{msg.content}</p>
                    <p className="text-[10px] text-[#64748b] mt-1 text-right" title={new Date(msg.createdAt).toLocaleString()}>
                      {formatDistanceToNow(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-[#1e2a3a] bg-[#0a0e1a]/50">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-1 bg-[#0f1525] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] placeholder-[#64748b] focus:border-[#c9a84c]/50 focus:outline-none transition-colors"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className={cn(
                  'p-2.5 rounded-lg transition-colors',
                  inputValue.trim()
                    ? 'bg-[#c9a84c] text-[#0a0e1a] hover:bg-[#b8973f]'
                    : 'bg-[#1e2a3a] text-[#64748b] cursor-not-allowed'
                )}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Search */}
          <div className="px-4 py-2 border-b border-[#1e2a3a]">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="w-full bg-[#0f1525] border border-[#1e2a3a] rounded-lg pl-9 pr-3 py-2 text-sm text-[#f0f0f0] placeholder-[#64748b] focus:border-[#c9a84c]/50 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* User List */}
          <div className="flex-1 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-[#64748b]">
                <MessageCircle size={32} className="mb-2 opacity-50" />
                <p className="text-sm">No users found</p>
              </div>
            ) : (
              sortedUsers.map((user) => {
                const unread = unreadCounts[user.id] || 0;
                const lastMsg = messages
                  .filter(
                    (m) =>
                      (m.senderId === currentUser?.id && m.receiverId === user.id) ||
                      (m.senderId === user.id && m.receiverId === currentUser?.id)
                  )
                  .slice(-1)[0];

                return (
                  <button
                    key={user.id}
                    onClick={() => setActiveConversation(user.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[rgba(201,168,76,0.04)] transition-colors border-b border-[#1e2a3a]/30 text-left"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#c9a84c] to-[#a88a3a] flex items-center justify-center">
                        <span className="text-[#0a0e1a] font-semibold text-sm">
                          {user.name[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#0f1525] rounded-full flex items-center justify-center">
                        <Circle size={8} fill="#22c55e" className="text-[#22c55e]" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-[#f0f0f0] truncate">{user.name}</p>
                        {unread > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-[#ef4444] text-white text-[10px] font-medium flex-shrink-0">
                            {unread}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#64748b] truncate">
                        {lastMsg
                          ? `${lastMsg.senderId === currentUser?.id ? 'You: ' : ''}${lastMsg.content}`
                          : user.role?.name || 'User'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
