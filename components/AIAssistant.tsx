import React, { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import { Message } from '../types';
import { IconSparkles, IconSend, IconBot } from './Icons';

interface AIAssistantProps {
  messages: Message[];
  onSendMessage: (prompt: string) => void;
  isLoading: boolean;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ messages, onSendMessage, isLoading }) => {
  const [prompt, setPrompt] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleSend = () => {
    if (prompt.trim() && !isLoading) {
      onSendMessage(prompt);
      setPrompt('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderMessageContent = (text: string) => {
    const html = marked.parse(text, { gfm: true, breaks: true });
    // This is a basic sanitizer, a more robust library like DOMPurify is recommended for production
    const sanitizedHtml = typeof html === 'string' ? html.replace(/<script.*?>.*?<\/script>/gi, '') : '';
    return <div className="prose prose-sm prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
  };

  return (
    <div className="h-full flex flex-col bg-zinc-900 border-t border-zinc-800">
      <div className="flex-shrink-0 flex items-center gap-2 p-2 border-b border-zinc-800">
        <IconSparkles className="text-indigo-400" />
        <h2 className="text-xs font-bold text-zinc-300">Arquiteto de IA</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg, index) => (
          <div key={msg.id} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 flex-shrink-0 bg-zinc-700 rounded-full flex items-center justify-center">
                <IconBot />
              </div>
            )}
            <div className={`max-w-[85%] rounded-xl px-4 py-2 text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-300'}`}>
              {renderMessageContent(msg.text)}
            </div>
          </div>
        ))}

        {isLoading && (
            <div className="flex items-start gap-3">
                 <div className="w-6 h-6 flex-shrink-0 bg-zinc-700 rounded-full flex items-center justify-center">
                    <IconBot />
                </div>
                <div className="max-w-[85%] rounded-xl px-4 py-3 bg-zinc-800 text-zinc-300">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-zinc-500 rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
                        <div className="w-2 h-2 bg-zinc-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                        <div className="w-2 h-2 bg-zinc-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex-shrink-0 p-2 border-t border-zinc-800">
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte sobre seu projeto..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 pr-10 text-sm resize-none focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            rows={2}
            disabled={isLoading}
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !prompt.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md bg-indigo-600 text-white disabled:bg-zinc-600 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
          >
            <IconSend size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
