
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, GroundingChunk } from '../types';
import { getGeminiResponse } from '../services/geminiService';
import { CloseIcon, MapPinIcon, SearchIcon, SendIcon, BoxTruckIconBold } from './icons/Icons';

interface FleetAssistantProps {
    contextData: any;
    contextType: 'fleet' | 'crm' | 'financials' | 'routes';
}

// Enhanced Markdown Parser Component
const FormattedText: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;

  // Split by newlines but keep track of empty lines for spacing
  const lines = text.split('\n');

  return (
    <div className="text-sm space-y-1.5 leading-relaxed text-slate-800">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />; // Add space for paragraph breaks

        // Headers (e.g. ### Header)
        if (trimmed.startsWith('### ')) {
            return <h4 key={i} className="font-bold text-slate-900 mt-2 mb-1">{trimmed.substring(4)}</h4>
        }
        if (trimmed.startsWith('## ')) {
            return <h3 key={i} className="font-bold text-lg text-slate-900 mt-3 mb-1">{trimmed.substring(3)}</h3>
        }

        // List items detection
        const listMatch = line.match(/^(\s*)([\*\-]\s+)(.*)/);
        let isList = false;
        let indent = 0;
        let content = line;

        if (listMatch) {
            isList = true;
            indent = listMatch[1].length;
            content = listMatch[3];
        }

        // Parse Bold (**...**) and Italic (*...*)
        // Split by ** first to handle bold
        const parts = [];
        
        const boldSplit = content.split(/(\*\*.*?\*\*)/g);
        
        const parsedParts = boldSplit.map((part, j) => {
             if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
                 return <strong key={j} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
             }
             
             // Within non-bold parts, handle italics
             return part.split(/(\*.*?\*)/g).map((subPart, k) => {
                 if (subPart.startsWith('*') && subPart.endsWith('*') && subPart.length >= 3) {
                     return <em key={`${j}-${k}`} className="italic text-slate-700">{subPart.slice(1, -1)}</em>;
                 }
                 return <span key={`${j}-${k}`}>{subPart}</span>;
             });
        });

        if (isList) {
            return (
                <div key={i} className="flex items-start gap-2.5" style={{ marginLeft: `${indent * 0.5}rem` }}>
                    <span className="mt-2 w-1.5 h-1.5 bg-orange-500 rounded-full flex-shrink-0 opacity-80" />
                    <div className="flex-1">{parsedParts}</div>
                </div>
            )
        }

        return <div key={i}>{parsedParts}</div>;
      })}
    </div>
  );
};

const FleetAssistant: React.FC<FleetAssistantProps> = ({ contextData, contextType }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'bot', text: 'Hi there! I\'m your Heartfledge AI Assistant. I can help with fleet management, CRM insights, financial analysis, and route optimization. What can I do for you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const getPlaceholderText = () => {
      switch (contextType) {
          case 'fleet': return 'Ask about your fleet...';
          case 'crm': return 'Ask about your leads...';
          case 'financials': return 'Ask about invoices or expenses...';
          case 'routes': return 'Ask about routes and waypoints...';
          default: return 'Ask me anything...';
      }
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
      scrollToBottom();
  }, [messages]);

  const getLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location: ", error);
        }
      );
    }
  }, []);

  useEffect(() => {
      if (isOpen) {
          getLocation();
      }
  }, [isOpen, getLocation]);

  const handleSendMessage = async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const chatHistory = messages.map(msg => ({
      role: msg.sender === 'user' ? ('user' as const) : ('model' as const),
      parts: [{ text: msg.text }]
    }));

    try {
      const response = await getGeminiResponse(
        input, 
        chatHistory, 
        contextData,
        contextType,
        location
      );

      const botMessageText = response.text;
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] || [];

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: botMessageText,
        groundingChunks: groundingChunks.length > 0 ? groundingChunks : undefined,
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: 'Sorry, I am having trouble connecting. Please try again later.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const GroundingChunkDisplay: React.FC<{ chunk: GroundingChunk }> = ({ chunk }) => {
    if (chunk.web) {
      return (
        <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-blue-600 hover:underline bg-blue-50 px-2 py-1.5 rounded-lg text-xs mt-1 transition hover:bg-blue-100">
          <SearchIcon className="w-3.5 h-3.5" />
          <span className="truncate max-w-[200px]">{chunk.web.title}</span>
        </a>
      );
    }
    if (chunk.maps) {
       return (
        <a href={chunk.maps.uri} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-green-600 hover:underline bg-green-50 px-2 py-1.5 rounded-lg text-xs mt-1 transition hover:bg-green-100">
          <MapPinIcon className="w-3.5 h-3.5" />
          <span className="truncate max-w-[200px]">{chunk.maps.title}</span>
        </a>
      );
    }
    return null;
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="group fixed bottom-6 right-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 rounded-full shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-orange-500/30 z-50"
        aria-label="Open AI Assistant"
      >
        <BoxTruckIconBold className="w-8 h-8 transition-transform group-hover:translate-x-1" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[90vw] max-w-md h-[70vh] max-h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-slate-200 overflow-hidden font-sans">
      <header className="flex items-center justify-between p-5 border-b border-slate-100 bg-gradient-to-r from-orange-50/30 via-white to-orange-50/20">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-orange-100 to-orange-200 p-2 rounded-xl shadow-sm">
            <BoxTruckIconBold className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              AI Assistant
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
            </h3>
            <p className="text-[10px] text-slate-500 font-medium">Powered by Gemini</p>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition">
          <CloseIcon className="w-5 h-5" />
        </button>
      </header>

      <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-gradient-to-b from-slate-50/50 to-white custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`relative max-w-[85%] md:max-w-[88%] px-4 py-3.5 rounded-2xl shadow-sm transition-all hover:shadow-md ${
                msg.sender === 'user'
                ? 'bg-gradient-to-br from-orange-500 to-orange-600 border border-orange-500 text-white rounded-br-sm'
                : 'bg-white border border-slate-200 text-slate-900 rounded-bl-sm hover:border-slate-300'
            }`}>
              <FormattedText text={msg.text} />
              {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                <div className="mt-3 pt-3 border-t border-black/5 flex flex-wrap gap-2">
                    {msg.groundingChunks.map((chunk, index) => <GroundingChunkDisplay key={index} chunk={chunk} />)}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                <div className="px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 rounded-bl-sm shadow-sm">
                    <div className="flex items-center space-x-1.5">
                        <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse"></span>
                        <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse [animation-delay:0.2s]"></span>
                        <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse [animation-delay:0.4s]"></span>
                    </div>
                </div>
            </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 border-t border-slate-100 bg-gradient-to-r from-slate-50/50 to-white">
        <div className="flex items-center gap-2.5 bg-white rounded-2xl px-2 py-2 border border-slate-200 focus-within:ring-2 focus-within:ring-orange-500/30 focus-within:border-orange-400 transition-all shadow-sm hover:shadow-md">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={getPlaceholderText()}
            className="flex-1 px-3 py-2 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            disabled={isLoading}
            autoFocus
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || input.trim() === ''}
            className="p-2.5 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg hover:scale-105 flex-shrink-0"
          >
            <SendIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FleetAssistant;
