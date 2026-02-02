import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, AlertCircle, Loader, Settings as SettingsIcon, Database, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  data?: any;
  sql?: string;
  timestamp: Date;
}

export const AIAgentChat: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant. I can help you query and analyze your database. Try asking me questions like:\n\n• "Show me all quotes from last month"\n• "Which customers have pending approvals?"\n• "What are the top 5 products by revenue?"\n• "Show me quotes with margin below 20%"',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeyConfigured, setApiKeyConfigured] = useState<boolean | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    checkApiKeyConfiguration();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkApiKeyConfiguration = async () => {
    try {
      const { data } = await supabase
        .from('app_configurations')
        .select('config_value')
        .eq('config_key', 'claude_api_key')
        .maybeSingle();

      setApiKeyConfigured(!!data?.config_value);
    } catch (error) {
      console.error('Error checking API key:', error);
      setApiKeyConfigured(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-agent`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: input.trim(),
            conversation_history: conversationHistory,
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Query failed');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.message || 'Query executed successfully',
        data: result.data,
        sql: result.sql,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'An error occurred'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatData = (data: any) => {
    if (!data) return null;

    if (Array.isArray(data)) {
      if (data.length === 0) {
        return <div className="text-[#666] text-sm">No results found.</div>;
      }

      return (
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full border border-[#d4d4d4] rounded">
            <thead className="bg-[#f5f5f5]">
              <tr>
                {Object.keys(data[0]).map((key) => (
                  <th
                    key={key}
                    className="px-3 py-2 text-left text-xs font-medium text-[#333] border-b border-[#d4d4d4]"
                  >
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row: any, idx: number) => (
                <tr
                  key={idx}
                  className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f9f9f9]'}
                >
                  {Object.values(row).map((value: any, cellIdx: number) => (
                    <td
                      key={cellIdx}
                      className="px-3 py-2 text-sm text-[#333] border-b border-[#e4e4e4]"
                    >
                      {value === null || value === undefined
                        ? '-'
                        : typeof value === 'object'
                        ? JSON.stringify(value)
                        : String(value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-xs text-[#666] mt-2">
            {data.length} row{data.length !== 1 ? 's' : ''} returned
          </div>
        </div>
      );
    }

    return (
      <pre className="mt-3 bg-[#f5f5f5] p-3 rounded text-sm overflow-x-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  };

  if (apiKeyConfigured === false) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center p-5">
        <div className="bg-white rounded border border-[#d4d4d4] p-8 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-[#f0ad4e] mx-auto mb-4" />
          <h2 className="text-xl font-medium text-[#333] mb-2">
            Claude API Key Not Configured
          </h2>
          <p className="text-[#666] mb-6">
            To use the AI agent, you need to configure your Claude API key in the system settings.
          </p>
          <a
            href="/settings"
            className="inline-flex items-center space-x-2 px-6 py-2 bg-[#428bca] text-white rounded hover:bg-[#3276b1] transition"
          >
            <SettingsIcon className="h-4 w-4" />
            <span>Go to Settings</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f0f0] flex flex-col">
      <div className="bg-white border-b border-[#d4d4d4] sticky top-0 z-40">
        <div className="px-5 py-3">
          <div className="text-xs text-[#999] mb-2">AI Assistant</div>
          <div className="flex items-center space-x-3">
            <Bot className="h-6 w-6 text-[#428bca]" />
            <div>
              <h1 className="text-xl font-normal text-[#333]">Database Agent</h1>
              <p className="text-xs text-[#666] mt-1">
                Ask questions about your quotes, customers, and inventory
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`flex space-x-3 max-w-[80%] ${
                  message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user'
                      ? 'bg-[#428bca]'
                      : 'bg-[#5cb85c]'
                  }`}
                >
                  {message.role === 'user' ? (
                    <User className="h-4 w-4 text-white" />
                  ) : (
                    <Bot className="h-4 w-4 text-white" />
                  )}
                </div>

                <div
                  className={`rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-[#428bca] text-white'
                      : 'bg-white border border-[#d4d4d4]'
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm">
                    {message.content}
                  </div>

                  {message.sql && (
                    <details className="mt-3">
                      <summary className="text-xs cursor-pointer flex items-center space-x-1 text-[#428bca] hover:text-[#3276b1]">
                        <Database className="h-3 w-3" />
                        <span>View SQL Query</span>
                      </summary>
                      <pre className="mt-2 bg-gray-900 text-green-400 p-2 rounded text-xs overflow-x-auto">
                        {message.sql}
                      </pre>
                    </details>
                  )}

                  {message.data && formatData(message.data)}

                  <div className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex space-x-3 max-w-[80%]">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#5cb85c] flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-white border border-[#d4d4d4] rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Loader className="h-4 w-4 animate-spin text-[#428bca]" />
                    <span className="text-sm text-[#666]">Thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="bg-white border-t border-[#d4d4d4] p-5">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex space-x-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Ask a question about your data..."
              className="flex-1 px-4 py-3 border border-[#d4d4d4] rounded focus:ring-2 focus:ring-[#428bca] focus:border-[#428bca] resize-none"
              rows={1}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-6 py-3 bg-[#428bca] text-white rounded hover:bg-[#3276b1] disabled:bg-[#d4d4d4] disabled:cursor-not-allowed transition flex items-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>Send</span>
            </button>
          </div>
          <div className="text-xs text-[#666] mt-2">
            Press Enter to send, Shift+Enter for new line
          </div>
        </form>
      </div>
    </div>
  );
};
