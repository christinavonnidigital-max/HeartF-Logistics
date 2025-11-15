
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, GroundingChunk } from '../types';
import { getGeminiResponse } from '../services/geminiService';
import { CloseIcon, MapPinIcon, SearchIcon, SendIcon, SparklesIcon } from './icons/Icons';

interface FleetAssistantProps {
    contextData: any;
    contextType: 'fleet' | 'crm' | 'financials' | 'routes';
}

const FleetAssistant: React.FC<FleetAssistantProps> = ({ contextData, contextType }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'bot', text: 'Hello! I am the assistant for Heartfledge Logistics. How can I help you keep things moving today?' }
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
        <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-blue-500 hover:underline">
          <SearchIcon className="w-4 h-4" />
          <span>{chunk.web.title}</span>
        </a>
      );
    }
    if (chunk.maps) {
       return (
        <a href={chunk.maps.uri} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-green-500 hover:underline">
          <MapPinIcon className="w-4 h-4" />
          <span>{chunk.maps.title}</span>
        </a>
      );
    }
    return null;
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-orange-500 text-white p-4 rounded-full shadow-lg hover:bg-orange-600 transition transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 z-50"
        aria-label="Open AI Assistant"
      >
        <SparklesIcon className="w-8 h-8" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[90vw] max-w-md h-[70vh] max-h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200">
      <header className="flex items-center justify-between p-4 border-b border-gray-200 rounded-t-2xl bg-gray-50">
        <div className="flex items-center space-x-2">
          <SparklesIcon className="w-6 h-6 text-orange-500" />
          <h3 className="text-lg font-bold">AI Assistant</h3>
        </div>
        <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-gray-200">
          <CloseIcon className="w-5 h-5" />
        </button>
      </header>

      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-sm px-4 py-2 rounded-2xl ${
                msg.sender === 'user' ? 'bg-orange-500 text-white rounded-br-lg' : 'bg-gray-200 text-gray-900 rounded-bl-lg'
            }`}>
              <p className="whitespace-pre-wrap">{msg.text}</p>
              {msg.groundingChunks && (
                <div className="mt-2 pt-2 border-t border-gray-300 space-y-1 text-sm">
                    {msg.groundingChunks.map((chunk, index) => <GroundingChunkDisplay key={index} chunk={chunk} />)}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                <div className="px-4 py-2 rounded-2xl bg-gray-200 text-gray-900 rounded-bl-lg">
                    <div className="flex items-center space-x-1">
                        <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></span>
                        <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse [animation-delay:0.2s]"></span>
                        <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse [animation-delay:0.4s]"></span>
                    </div>
                </div>
            </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={getPlaceholderText()}
            className="flex-1 px-4 py-2 rounded-full border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || input.trim() === ''}
            className="p-3 bg-orange-500 text-white rounded-full disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-orange-600 transition"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FleetAssistant;