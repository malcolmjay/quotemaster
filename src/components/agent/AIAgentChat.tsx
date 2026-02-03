import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, AlertCircle, Loader, Settings as SettingsIcon, Database, CheckCircle, MessageSquare, Plus, Edit2, Trash2, Download, Save, X, Paperclip, File } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { exportToCSV, exportToJSON } from '../../utils/exportUtils';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  path: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  data?: any;
  sql?: string;
  files?: UploadedFile[];
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export const AIAgentChat: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeyConfigured, setApiKeyConfigured] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkApiKeyConfiguration();
    loadConversations();
  }, []);

  useEffect(() => {
    if (currentConversationId) {
      loadMessages(currentConversationId);
    } else {
      setMessages([getWelcomeMessage()]);
    }
  }, [currentConversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getWelcomeMessage = (): Message => ({
    id: 'welcome',
    role: 'assistant',
    content: 'Hello! I\'m your AI assistant. I can help you query and analyze your database. Try asking me questions like:\n\n• "Show me all quotes from last month"\n• "Which customers have pending approvals?"\n• "What are the top 5 products by revenue?"\n• "Show me quotes with margin below 20%"',
    timestamp: new Date(),
  });

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

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('id, title, created_at, updated_at')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('ai_messages')
        .select('id, role, content, data, sql, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const loadedMessages: Message[] = data.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        data: msg.data,
        sql: msg.sql || undefined,
        timestamp: new Date(msg.created_at),
      }));

      setMessages(loadedMessages.length > 0 ? loadedMessages : [getWelcomeMessage()]);
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([getWelcomeMessage()]);
    }
  };

  const createNewConversation = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .insert({
          title: 'New Conversation',
          user_id: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      setConversations(prev => [data, ...prev]);
      setCurrentConversationId(data.id);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const updateConversationTitle = async (id: string, title: string) => {
    try {
      const { error } = await supabase
        .from('ai_conversations')
        .update({ title })
        .eq('id', id);

      if (error) throw error;

      setConversations(prev =>
        prev.map(conv => (conv.id === id ? { ...conv, title } : conv))
      );
    } catch (error) {
      console.error('Error updating conversation title:', error);
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setConversations(prev => prev.filter(conv => conv.id !== id));
      if (currentConversationId === id) {
        setCurrentConversationId(null);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const saveMessage = async (message: Message, conversationId?: string) => {
    const convId = conversationId || currentConversationId;
    if (!convId) return;

    try {
      await supabase.from('ai_messages').insert({
        conversation_id: convId,
        role: message.role,
        content: message.content,
        data: message.data || null,
        sql: message.sql || null,
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${user?.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('ai-agent-files')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('ai-agent-files')
          .getPublicUrl(filePath);

        return {
          id: fileName,
          name: file.name,
          size: file.size,
          type: file.type,
          url: urlData.publicUrl,
          path: filePath,
        };
      });

      const newFiles = await Promise.all(uploadPromises);
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload files. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    let conversationId = currentConversationId;

    if (!conversationId) {
      try {
        const { data, error } = await supabase
          .from('ai_conversations')
          .insert({
            title: input.trim().slice(0, 50),
            user_id: user?.id,
          })
          .select()
          .single();

        if (error) throw error;

        conversationId = data.id;
        setCurrentConversationId(conversationId);
        setConversations(prev => [data, ...prev]);
      } catch (error) {
        console.error('Error creating conversation:', error);
        return;
      }
    }

    const currentFiles = [...uploadedFiles];

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      files: currentFiles.length > 0 ? currentFiles : undefined,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    await saveMessage(userMessage, conversationId);

    if (currentFiles.length > 0) {
      try {
        await supabase.from('ai_conversation_files').insert(
          currentFiles.map((file) => ({
            conversation_id: conversationId,
            user_id: user?.id,
            file_name: file.name,
            file_path: file.path,
            file_size: file.size,
            mime_type: file.type,
          }))
        );
      } catch (error) {
        console.error('Error saving file records:', error);
      }
    }

    setInput('');
    setUploadedFiles([]);
    setIsLoading(true);

    try {
      const conversationHistory = messages
        .filter(msg => msg.id !== 'welcome')
        .map((msg) => ({
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
            files: currentFiles.length > 0 ? currentFiles : undefined,
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
      await saveMessage(assistantMessage, conversationId);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'An error occurred'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      await saveMessage(errorMessage, conversationId);
    } finally {
      setIsLoading(false);
    }
  };

  const extractCSVFromMessage = (content: string): string | null => {
    const csvPattern = /```csv\n([\s\S]*?)\n```/;
    const match = content.match(csvPattern);
    return match ? match[1] : null;
  };

  const extractCodeBlock = (content: string, language?: string): { content: string; language: string } | null => {
    const pattern = language
      ? new RegExp(`\`\`\`${language}\\n([\\s\\S]*?)\\n\`\`\``)
      : /```(\w+)?\n([\s\S]*?)\n```/;
    const match = content.match(pattern);

    if (match) {
      if (language) {
        return { content: match[1], language };
      }
      return { content: match[2], language: match[1] || 'text' };
    }
    return null;
  };

  const downloadTextAsFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatData = (data: any, messageId: string) => {
    if (!data) return null;

    if (Array.isArray(data)) {
      if (data.length === 0) {
        return <div className="text-[#666] text-sm">No results found.</div>;
      }

      return (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-[#666]">
              {data.length} row{data.length !== 1 ? 's' : ''} returned
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => exportToCSV(data, `export-${messageId}.csv`)}
                className="flex items-center space-x-1 px-2 py-1 text-xs bg-[#5cb85c] text-white rounded hover:bg-[#4cae4c] transition"
              >
                <Download className="h-3 w-3" />
                <span>CSV</span>
              </button>
              <button
                onClick={() => exportToJSON(data, `export-${messageId}.json`)}
                className="flex items-center space-x-1 px-2 py-1 text-xs bg-[#428bca] text-white rounded hover:bg-[#3276b1] transition"
              >
                <Download className="h-3 w-3" />
                <span>JSON</span>
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
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
          </div>
        </div>
      );
    }

    return (
      <div className="mt-3">
        <div className="flex items-center justify-end mb-2">
          <button
            onClick={() => exportToJSON(data, `export-${messageId}.json`)}
            className="flex items-center space-x-1 px-2 py-1 text-xs bg-[#428bca] text-white rounded hover:bg-[#3276b1] transition"
          >
            <Download className="h-3 w-3" />
            <span>JSON</span>
          </button>
        </div>
        <pre className="bg-[#f5f5f5] p-3 rounded text-sm overflow-x-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
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
    <div className="min-h-screen bg-[#f0f0f0] flex">
      {sidebarOpen && (
        <div className="w-64 bg-white border-r border-[#d4d4d4] flex flex-col">
          <div className="p-4 border-b border-[#d4d4d4]">
            <button
              onClick={createNewConversation}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-[#428bca] text-white rounded hover:bg-[#3276b1] transition"
            >
              <Plus className="h-4 w-4" />
              <span>New Chat</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-[#999] text-sm">
                No conversations yet
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`group relative rounded p-3 cursor-pointer transition ${
                      currentConversationId === conv.id
                        ? 'bg-[#f0f0f0]'
                        : 'hover:bg-[#f9f9f9]'
                    }`}
                  >
                    {editingConversationId === conv.id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateConversationTitle(conv.id, editingTitle);
                              setEditingConversationId(null);
                            } else if (e.key === 'Escape') {
                              setEditingConversationId(null);
                            }
                          }}
                          className="flex-1 px-2 py-1 text-sm border border-[#d4d4d4] rounded"
                          autoFocus
                        />
                        <button
                          onClick={() => {
                            updateConversationTitle(conv.id, editingTitle);
                            setEditingConversationId(null);
                          }}
                          className="text-[#5cb85c] hover:text-[#4cae4c]"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div
                          onClick={() => setCurrentConversationId(conv.id)}
                          className="flex items-start space-x-2"
                        >
                          <MessageSquare className="h-4 w-4 text-[#666] flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-[#333] truncate">
                              {conv.title}
                            </div>
                            <div className="text-xs text-[#999] mt-1">
                              {new Date(conv.updated_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 flex space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingConversationId(conv.id);
                              setEditingTitle(conv.title);
                            }}
                            className="p-1 text-[#428bca] hover:bg-[#e7f3ff] rounded"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Delete this conversation?')) {
                                deleteConversation(conv.id);
                              }
                            }}
                            className="p-1 text-[#d9534f] hover:bg-[#fdf2f2] rounded"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-[#d4d4d4] sticky top-0 z-40">
          <div className="px-5 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="text-[#666] hover:text-[#333] transition"
                >
                  <MessageSquare className="h-5 w-5" />
                </button>
                <div>
                  <div className="text-xs text-[#999]">AI Assistant</div>
                  <h1 className="text-xl font-normal text-[#333] flex items-center space-x-2">
                    <Bot className="h-6 w-6 text-[#428bca]" />
                    <span>Database Agent</span>
                  </h1>
                  <p className="text-xs text-[#666] mt-1">
                    Ask questions about your quotes, customers, and inventory
                  </p>
                </div>
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

                  {message.role === 'assistant' && message.content && (() => {
                    const csvContent = extractCSVFromMessage(message.content);
                    const allCodeBlocks = message.content.match(/```(\w+)?\n([\s\S]*?)\n```/g);

                    if (csvContent || allCodeBlocks) {
                      return (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {csvContent && (
                            <button
                              onClick={() => downloadTextAsFile(csvContent, `template-${message.id}.csv`)}
                              className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-[#5cb85c] text-white rounded hover:bg-[#4cae4c] transition"
                            >
                              <Download className="h-3.5 w-3.5" />
                              <span>Download CSV Template</span>
                            </button>
                          )}
                          {allCodeBlocks && allCodeBlocks.map((block, idx) => {
                            const match = block.match(/```(\w+)?\n([\s\S]*?)\n```/);
                            if (!match) return null;
                            const lang = match[1] || 'text';
                            const content = match[2];
                            if (lang === 'csv') return null;

                            const extension = lang === 'json' ? 'json' : lang === 'sql' ? 'sql' : 'txt';
                            return (
                              <button
                                key={idx}
                                onClick={() => downloadTextAsFile(content, `output-${message.id}-${idx}.${extension}`)}
                                className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-[#428bca] text-white rounded hover:bg-[#3276b1] transition"
                              >
                                <Download className="h-3.5 w-3.5" />
                                <span>Download {lang.toUpperCase()}</span>
                              </button>
                            );
                          })}
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {message.files && message.files.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.files.map((file) => (
                        <div
                          key={file.id}
                          className={`flex items-center space-x-2 px-3 py-2 rounded ${
                            message.role === 'user'
                              ? 'bg-[#3276b1]'
                              : 'bg-[#f5f5f5]'
                          }`}
                        >
                          <File className="h-4 w-4" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs truncate">{file.name}</div>
                            <div className="text-xs opacity-70">{formatFileSize(file.size)}</div>
                          </div>
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-xs hover:underline ${
                              message.role === 'user' ? 'text-white' : 'text-[#428bca]'
                            }`}
                          >
                            View
                          </a>
                        </div>
                      ))}
                    </div>
                  )}

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

                  {message.data && formatData(message.data, message.id)}

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
          {uploadedFiles.length > 0 && (
            <div className="mb-3 space-y-2">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center space-x-2 px-3 py-2 bg-[#f5f5f5] rounded border border-[#d4d4d4]"
                >
                  <File className="h-4 w-4 text-[#666]" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[#333] truncate">{file.name}</div>
                    <div className="text-xs text-[#666]">{formatFileSize(file.size)}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(file.id)}
                    className="text-[#d9534f] hover:text-[#c9302c] transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex space-x-3">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              multiple
              accept="image/*,.pdf,.txt,.csv,.json,.xls,.xlsx"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isUploading}
              className="px-4 py-3 border border-[#d4d4d4] text-[#666] rounded hover:bg-[#f5f5f5] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center space-x-2"
              title="Upload files"
            >
              {isUploading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Paperclip className="h-4 w-4" />
              )}
            </button>
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
            Press Enter to send, Shift+Enter for new line • Click the paperclip to attach files
          </div>
        </form>
      </div>
      </div>
    </div>
  );
};
