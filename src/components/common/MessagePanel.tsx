import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Loader2, Trash2, AtSign } from 'lucide-react';
import {
  getQuoteMessages,
  getLineItemMessages,
  createMessage,
  deleteMessage,
  subscribeToMessages,
  type Message
} from '../../lib/supabase';
import { useAuthContext } from '../auth/AuthProvider';
import { supabase } from '../../lib/supabase';
import { sanitizeSearchTerm } from '../../utils/validation';

interface UserSuggestion {
  id: string;
  email: string;
  display_name: string;
}

interface MessagePanelProps {
  quoteId?: string;
  lineItemId?: string;
  title?: string;
  onClose?: () => void;
}

export const MessagePanel: React.FC<MessagePanelProps> = ({
  quoteId,
  lineItemId,
  title,
  onClose
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionSuggestions, setMentionSuggestions] = useState<UserSuggestion[]>([]);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [mentionStartPos, setMentionStartPos] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mentionDropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthContext();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = quoteId
        ? await getQuoteMessages(quoteId)
        : lineItemId
        ? await getLineItemMessages(lineItemId)
        : [];
      setMessages(data);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!quoteId && !lineItemId) return;
    loadMessages();

    const channel = subscribeToMessages(quoteId, lineItemId, () => {
      loadMessages();
    });

    return () => {
      channel.unsubscribe();
    };
  }, [quoteId, lineItemId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      setSending(true);
      setError(null);
      await createMessage(newMessage, quoteId, lineItemId);
      setNewMessage('');
      await loadMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      await deleteMessage(messageId);
      await loadMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message');
    }
  };

  const searchUsers = async (query: string) => {
    if (!query) {
      setMentionSuggestions([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_display_info')
        .select('id, email, display_name')
        .or(`display_name.ilike.%${sanitizeSearchTerm(query)}%,email.ilike.%${sanitizeSearchTerm(query)}%`)
        .limit(5);

      if (error) throw error;
      setMentionSuggestions(data || []);
      setSelectedMentionIndex(0);
    } catch (err) {
      console.error('Failed to search users:', err);
      setMentionSuggestions([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart || 0;

    setNewMessage(value);

    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

    if (lastAtSymbol !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtSymbol + 1);
      const hasSpaceAfterAt = textAfterAt.includes(' ');

      if (!hasSpaceAfterAt) {
        setShowMentions(true);
        setMentionStartPos(lastAtSymbol);
        setMentionSearch(textAfterAt);
        searchUsers(textAfterAt);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (suggestion: UserSuggestion) => {
    const beforeMention = newMessage.substring(0, mentionStartPos);
    const afterCursor = newMessage.substring(inputRef.current?.selectionStart || newMessage.length);
    const newText = `${beforeMention}@${suggestion.display_name} ${afterCursor}`;

    setNewMessage(newText);
    setShowMentions(false);
    setMentionSearch('');
    setMentionSuggestions([]);

    setTimeout(() => {
      if (inputRef.current) {
        const newCursorPos = mentionStartPos + suggestion.display_name.length + 2;
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showMentions || mentionSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedMentionIndex((prev) =>
        prev < mentionSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedMentionIndex((prev) => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter' && showMentions) {
      e.preventDefault();
      if (mentionSuggestions[selectedMentionIndex]) {
        insertMention(mentionSuggestions[selectedMentionIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowMentions(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mentionDropdownRef.current &&
        !mentionDropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowMentions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = new Date(now.getTime() - 86400000).toDateString() === date.toDateString();

    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    if (isToday) {
      return `Today at ${timeStr}`;
    } else if (isYesterday) {
      return `Yesterday at ${timeStr}`;
    } else {
      const dateStr = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
      return `${dateStr} at ${timeStr}`;
    }
  };

  const renderMessageWithMentions = (text: string, isOwnMessage: boolean) => {
    const mentionRegex = /@([a-zA-Z0-9._-]+(?:\s+[a-zA-Z0-9._-]+)*)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      parts.push(
        <span
          key={match.index}
          className={`font-semibold ${
            isOwnMessage
              ? 'text-blue-100 bg-blue-600/30 px-1 rounded'
              : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1 rounded'
          }`}
        >
          @{match[1]}
        </span>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-slate-800 shadow-xl border-l border-[#d4d4d4] dark:border-slate-700 flex flex-col z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#d4d4d4] dark:border-slate-700 bg-[#fafafa] dark:bg-slate-700/50">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-[#428bca]" />
          <h3 className="font-medium text-[#333] dark:text-white">
            {title || 'Messages'}
          </h3>
          <span className="text-xs text-[#666] dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full">
            {messages.length}
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#e8e8e8] dark:hover:bg-slate-600 rounded transition-colors"
          >
            <X className="w-4 h-4 text-[#666]" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-[#428bca] animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-[#666] dark:text-slate-400 text-sm">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>No messages yet</p>
            <p className="text-xs mt-1">Start a conversation to coordinate on this quote</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.created_by === user?.id;
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}
              >
                <div className={`max-w-[80%] ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                  <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    <span className={`text-xs font-semibold ${isOwnMessage ? 'text-[#428bca] dark:text-blue-400' : 'text-[#428bca] dark:text-blue-400'}`}>
                      {message.user_name}
                    </span>
                    <span className="text-xs text-[#666] dark:text-slate-400">
                      {formatTimestamp(message.created_at)}
                      {message.is_edited && ' (edited)'}
                    </span>
                    {isOwnMessage && (
                      <button
                        onClick={() => handleDeleteMessage(message.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                        title="Delete message"
                      >
                        <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
                      </button>
                    )}
                  </div>
                  <div
                    className={`px-3 py-2 rounded-lg inline-block ${
                      isOwnMessage
                        ? 'bg-[#428bca] text-white'
                        : 'bg-[#f0f0f0] dark:bg-slate-700 text-[#333] dark:text-white'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {renderMessageWithMentions(message.message, isOwnMessage)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="p-4 border-t border-[#d4d4d4] dark:border-slate-700 bg-[#fafafa] dark:bg-slate-700/50">
        <div className="relative">
          {showMentions && mentionSuggestions.length > 0 && (
            <div
              ref={mentionDropdownRef}
              className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-slate-800 border border-[#d4d4d4] dark:border-slate-600 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10"
            >
              {mentionSuggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => insertMention(suggestion)}
                  className={`w-full px-4 py-2 text-left hover:bg-[#f0f0f0] dark:hover:bg-slate-700 transition-colors flex items-center gap-3 ${
                    index === selectedMentionIndex ? 'bg-[#f0f0f0] dark:bg-slate-700' : ''
                  }`}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#428bca] text-white flex items-center justify-center font-semibold text-sm">
                    {suggestion.display_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#333] dark:text-white truncate">
                      {suggestion.display_name}
                    </div>
                    <div className="text-xs text-[#666] dark:text-slate-400 truncate">
                      {suggestion.email}
                    </div>
                  </div>
                  <AtSign className="w-4 h-4 text-[#666] dark:text-slate-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... Use @ to mention someone"
              disabled={sending}
              className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-[#d4d4d4] dark:border-slate-600 rounded text-sm text-[#333] dark:text-white placeholder-[#999] focus:ring-2 focus:ring-[#428bca] focus:border-[#428bca] transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="px-4 py-2 bg-[#428bca] hover:bg-[#3276b1] text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
