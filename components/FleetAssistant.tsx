import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Message, GroundingChunk, Currency } from '../types';
import { getGeminiResponse } from '../services/geminiService';
import { CloseIcon, MapPinIcon, SearchIcon, SendIcon } from './icons';
import { BoxTruckIconBold } from './icons';
import { useData } from '../contexts/DataContext';
import {
  AssistantBookingDraft,
  AssistantEmailDraft,
  getFunctionDeclarations,
  runAssistantTool,
  ToolRunResult
} from '../assistant/tools';
import AddBookingModal from './AddBookingModal';
import EmailComposer from './campaignBuilder/EmailComposer';
import type { AppSettings } from '../App';

interface FleetAssistantProps {
  contextData: any;
  contextType: 'fleet' | 'crm' | 'financials' | 'routes';
  settings?: Partial<AppSettings>;
}

// Minimal Markdown-ish renderer (calm, Notes-like)
// - Uses text-current so user/assistant styling works
// - Preserves spacing and list bullets
const FormattedText: React.FC<{ text: string; className?: string }> = ({ text, className }) => {
  if (!text) return null;

  const lines = text.split('\n');

  return (
    <div className={`text-[15px] leading-7 text-current ${className || ''}`}>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-3" />;

        // Headers
        if (trimmed.startsWith('### ')) {
          return (
            <div key={i} className="mt-4 mb-1 font-semibold text-current">
              {trimmed.substring(4)}
            </div>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <div key={i} className="mt-5 mb-2 text-lg font-semibold tracking-tight text-current">
              {trimmed.substring(3)}
            </div>
          );
        }

        // List items
        const listMatch = line.match(/^(\s*)([\*\-]\s+)(.*)/);
        let isList = false;
        let indent = 0;
        let content = line;

        if (listMatch) {
          isList = true;
          indent = listMatch[1].length;
          content = listMatch[3];
        }

        // Bold + Italic parsing
        const boldSplit = content.split(/(\*\*.*?\*\*)/g);

        const parsedParts = boldSplit.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
            return (
              <strong key={j} className="font-semibold text-current">
                {part.slice(2, -2)}
              </strong>
            );
          }

          return part.split(/(\*.*?\*)/g).map((subPart, k) => {
            if (subPart.startsWith('*') && subPart.endsWith('*') && subPart.length >= 3) {
              return (
                <em key={`${j}-${k}`} className="italic text-current opacity-90">
                  {subPart.slice(1, -1)}
                </em>
              );
            }
            return <span key={`${j}-${k}`}>{subPart}</span>;
          });
        });

        if (isList) {
          return (
            <div
              key={i}
              className="flex items-start gap-3"
              style={{ marginLeft: `${indent * 0.5}rem` }}
            >
              <span className="mt-[0.62rem] w-1.5 h-1.5 rounded-full bg-current opacity-50 shrink-0" />
              <div className="flex-1">{parsedParts}</div>
            </div>
          );
        }

        return <div key={i}>{parsedParts}</div>;
      })}
    </div>
  );
};

const FleetAssistant: React.FC<FleetAssistantProps> = ({ contextData, contextType, settings }) => {
  const { bookings, invoices, customers, leads, opportunities, leadActivities, auditLog, addBooking, logAuditEvent } =
    useData();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text:
        "Hi there! I'm your Heartfledge AI Assistant. I can help with fleet management, CRM insights, financial analysis, and route optimization. What can I do for you today?"
    }
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const [bookingDraft, setBookingDraft] = useState<AssistantBookingDraft | null>(null);
  const [emailDraft, setEmailDraft] = useState<AssistantEmailDraft | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const assistantTools = useMemo(() => getFunctionDeclarations(), []);

  const toolContext = useMemo(
    () => ({
      data: {
        bookings,
        invoices,
        customers,
        leads,
        opportunities,
        leadActivities,
        auditLog,
        leadScoringRules: contextData?.leadScoringRules || [],
        defaultCurrency: (settings?.currency as Currency | undefined) || Currency.USD
      },
      actions: {
        openBookingModal: (draft: AssistantBookingDraft) => setBookingDraft(draft),
        openEmailComposer: (draft: AssistantEmailDraft) => setEmailDraft(draft)
      }
    }),
    [
      auditLog,
      bookings,
      customers,
      invoices,
      leadActivities,
      leads,
      opportunities,
      contextData?.leadScoringRules,
      settings?.currency
    ]
  );

  const getPlaceholderText = () => {
    switch (contextType) {
      case 'fleet':
        return 'Write a note about your fleet…';
      case 'crm':
        return 'Write a note about leads or customers…';
      case 'financials':
        return 'Write a note about invoices or expenses…';
      case 'routes':
        return 'Write a note about routes and waypoints…';
      default:
        return 'Write a note…';
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
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location: ', error);
        }
      );
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      getLocation();
    }
  }, [isOpen, getLocation]);

  const formatToolResult = (toolName: string, result: ToolRunResult) => {
    const lines = [result?.message || `${toolName} executed.`];
    const data = result?.data as any;

    if (toolName === 'find_overdue_invoices' && data?.invoices?.length) {
      const invoicesList = data.invoices as any[];
      invoicesList.slice(0, 3).forEach((inv: any) => {
        lines.push(
          `- ${inv.invoiceNumber} (${inv.customerName}) • ${inv.balanceDue} due ${inv.dueDate} (${inv.daysOverdue}d late)`
        );
      });
      if (invoicesList.length > 3) lines.push(`...and ${invoicesList.length - 3} more.`);
    }

    if (toolName === 'summarize_customer_activity' && data?.customer) {
      lines.push(`- Bookings: ${data.bookingsCount}, Opportunities: ${data.opportunitiesCount}`);
      if (data.openBalance !== undefined) lines.push(`- Open balance: ${data.openBalance}`);
      if (data.lastBooking) lines.push(`- Latest booking: ${data.lastBooking}`);
      if (data.lastInvoice) lines.push(`- Latest invoice: ${data.lastInvoice}`);
    }

    if (toolName === 'explain_lead_score_change' && data?.matches) {
      const drivers = (data.matches as any[]).map((m) => `${m.rule} (${m.points})`).join(', ');
      lines.push(`- Drivers: ${drivers || 'No matching rules.'}`);
      lines.push(`- Recomputed score: ${data.recomputedScore} (Δ ${data.delta >= 0 ? '+' : ''}${data.delta})`);
    }

    if (toolName === 'draft_follow_up_email' && data?.subject) {
      lines.push(`- Subject: ${data.subject}`);
    }

    return lines.join('\n');
  };

  const mapToolToEntity = (toolName: string) => {
    switch (toolName) {
      case 'create_booking':
        return 'booking';
      case 'find_overdue_invoices':
        return 'invoice';
      case 'summarize_customer_activity':
        return 'customer';
      case 'draft_follow_up_email':
        return 'lead';
      case 'explain_lead_score_change':
        return 'lead';
      default:
        return 'assistant';
    }
  };

  const handleSendMessage = async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const chatHistory = messages.map((msg) => ({
      role: msg.sender === 'user' ? ('user' as const) : ('model' as const),
      parts: [{ text: msg.text }]
    }));

    try {
      const response = await getGeminiResponse(
        input,
        chatHistory,
        contextData,
        contextType,
        location,
        { functionDeclarations: assistantTools, toolConfig: { functionCallingConfig: { mode: 'AUTO' } } }
      );

      const candidate = response.candidates?.[0];
      const parts = (candidate?.content?.parts as any[]) || [];
      const functionCall = parts.find((part) => part.functionCall)?.functionCall;

      if (functionCall?.name) {
        const toolResult = runAssistantTool(functionCall.name, functionCall.args || {}, toolContext);

        if (logAuditEvent) {
          logAuditEvent({
            action: 'assistant.tool.call',
            entity: { type: mapToolToEntity(functionCall.name), ref: functionCall.name },
            meta: { args: functionCall.args, ok: toolResult.ok, message: toolResult.message }
          });
        }

        const toolMessage: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: formatToolResult(functionCall.name, toolResult)
        };

        const followUp = await getGeminiResponse(
          input,
          chatHistory,
          contextData,
          contextType,
          location,
          {
            functionDeclarations: assistantTools,
            extraContents: [
              { role: 'model' as const, parts },
              { role: 'user' as const, parts: [{ functionResponse: { name: functionCall.name, response: toolResult, id: functionCall.id } as any }] }
            ]
          }
        );

        const groundingChunks = (followUp.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[]) || [];
        const finalMessage: Message = {
          id: (Date.now() + 2).toString(),
          sender: 'bot',
          text: followUp.text || toolResult.message,
          groundingChunks: groundingChunks.length > 0 ? groundingChunks : undefined
        };

        setMessages((prev) => [...prev, toolMessage, finalMessage]);
      } else {
        const botMessageText = response.text;
        const groundingChunks = (response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[]) || [];

        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: botMessageText,
          groundingChunks: groundingChunks.length > 0 ? groundingChunks : undefined
        };

        setMessages((prev) => [...prev, botMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: 'Sorry, I am having trouble connecting. Please try again later.'
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const GroundingChunkDisplay: React.FC<{ chunk: GroundingChunk }> = ({ chunk }) => {
    if (chunk.web) {
      return (
        <a
          href={chunk.web.uri}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition max-w-[280px]"
          title={chunk.web.title}
        >
          <SearchIcon className="w-3.5 h-3.5 opacity-70" />
          <span className="truncate">{chunk.web.title}</span>
        </a>
      );
    }
    if (chunk.maps) {
      return (
        <a
          href={chunk.maps.uri}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition max-w-[280px]"
          title={chunk.maps.title}
        >
          <MapPinIcon className="w-3.5 h-3.5 opacity-70" />
          <span className="truncate">{chunk.maps.title}</span>
        </a>
      );
    }
    return null;
  };

  const bookingModal = bookingDraft ? (
    <AddBookingModal
      onClose={() => setBookingDraft(null)}
      onAddBooking={(draft) => {
        addBooking(draft);
        setBookingDraft(null);
      }}
      initialData={bookingDraft}
    />
  ) : null;

  const emailComposerModal = emailDraft ? (
    <EmailComposer
      isOpen={true}
      onClose={() => setEmailDraft(null)}
      onSave={(payload: any) => {
        if (logAuditEvent) {
          logAuditEvent({
            action: 'assistant.tool.call',
            entity: { type: 'lead', ref: 'draft_follow_up_email' },
            meta: { subject: payload?.subject_line }
          });
        }
        setEmailDraft(null);
      }}
      initialData={{ subject_line: emailDraft.subject, email_body: emailDraft.body, delay_days: 0, delay_hours: 0 } as any}
    />
  ) : null;

  if (!isOpen) {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="group fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full border border-slate-200 bg-white shadow-lg hover:shadow-xl transition flex items-center justify-center"
          aria-label="Open AI Assistant"
          title="Assistant"
        >
          <BoxTruckIconBold className="w-7 h-7 text-slate-800 transition-transform group-hover:scale-105" />
        </button>
        {bookingModal}
        {emailComposerModal}
      </>
    );
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 w-[92vw] max-w-md h-[72vh] max-h-[720px] rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col">
        {/* Header - clean, minimal */}
        <header className="px-5 py-4 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center">
                <BoxTruckIconBold className="w-5 h-5 text-slate-800" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold tracking-tight text-slate-900 truncate">Assistant</div>
                <div className="text-xs text-slate-500 truncate">Write a note, get calm answers.</div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close assistant"
              title="Close"
              className="h-9 w-9 rounded-full border border-transparent hover:border-slate-200 hover:bg-slate-50 text-slate-600 transition flex items-center justify-center"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Messages - Notes-like surface */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="px-5 py-5">
            <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
              <div className="divide-y divide-slate-200">
                {messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div key={msg.id} className="p-4">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="text-[11px] font-semibold tracking-wide text-slate-500">
                          {isUser ? 'YOU' : 'ASSISTANT'}
                        </div>
                        <div className="text-[11px] text-slate-400">{isUser ? '' : isLoading ? 'Working…' : ''}</div>
                      </div>

                      <div className={isUser ? 'text-slate-900' : 'text-slate-900'}>
                        <FormattedText text={msg.text} />
                      </div>

                      {msg.groundingChunks && msg.groundingChunks.length > 0 ? (
                        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                          {msg.groundingChunks.map((chunk, index) => (
                            <GroundingChunkDisplay key={index} chunk={chunk} />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}

                {isLoading ? (
                  <div className="p-4">
                    <div className="text-[11px] font-semibold tracking-wide text-slate-500 mb-2">ASSISTANT</div>
                    <div className="inline-flex items-center gap-2 text-sm text-slate-600">
                      <span className="inline-flex gap-1.5 items-center">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse"></span>
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse [animation-delay:0.2s]"></span>
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse [animation-delay:0.4s]"></span>
                      </span>
                      Thinking…
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Composer - calm toolbar */}
        <div className="px-5 pb-5">
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="p-3">
              <div className="flex items-end gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={getPlaceholderText()}
                  className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-[15px] leading-7 text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300"
                  disabled={isLoading}
                  autoFocus
                />

                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || input.trim() === ''}
                  aria-label="Send message"
                  title="Send"
                  className="h-10 w-10 rounded-2xl border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <SendIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setMessages([{ id: '1', sender: 'bot', text: 'What would you like to work on?' }])}
                  className="text-xs px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition text-slate-700"
                  disabled={isLoading}
                  title="Start a new note"
                >
                  New note
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const text = messages.map((m) => `${m.sender === 'user' ? 'You' : 'Assistant'}: ${m.text}`).join('\n\n');
                    if (navigator?.clipboard?.writeText) navigator.clipboard.writeText(text);
                  }}
                  className="text-xs px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition text-slate-700"
                  disabled={messages.length === 0}
                  title="Copy transcript"
                >
                  Copy
                </button>

                <div className="ml-auto text-[11px] text-slate-400 flex items-center">
                  Press Enter to send
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {bookingModal}
      {emailComposerModal}
    </>
  );
};

export default FleetAssistant;
