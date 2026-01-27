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

type DetailsEntry = {
  title: string;
  body: string;
};

type LayoutMode = 'floating' | 'sidebar';

const LAYOUT_STORAGE_KEY = 'heartf_assistant_layout_mode_v1';

function safeJsonStringify(value: any, maxLen = 2000) {
  try {
    const s = JSON.stringify(value, null, 2);
    if (s.length > maxLen) return s.slice(0, maxLen) + '\n…';
    return s;
  } catch {
    return String(value);
  }
}

function normalizeUrl(url: string) {
  const u = String(url || '').trim();
  if (!u) return '';
  if (/^https?:\/\//i.test(u)) return u;
  return `https://${u}`;
}

/**
 * Notes-style markdown renderer (restrained).
 * Supports:
 * - Headings: #, ##, ###
 * - Bullet lists: -, *
 * - Inline code: `code`
 * - Code fences: ```lang ... ```
 * - Links: https://...
 *
 * Styling is intentionally calm: spacing + typography, no heavy colors.
 */
const NotesMarkdown: React.FC<{ text: string; className?: string }> = ({ text, className }) => {
  if (!text) return null;

  const lines = text.replace(/\r\n/g, '\n').split('\n');

  type Block =
    | { type: 'code'; lang?: string; content: string }
    | { type: 'text'; content: string[] };

  const blocks: Block[] = [];
  let inCode = false;
  let codeLang = '';
  let codeBuffer: string[] = [];
  let textBuffer: string[] = [];

  const flushText = () => {
    if (textBuffer.length) {
      blocks.push({ type: 'text', content: textBuffer });
      textBuffer = [];
    }
  };

  const flushCode = () => {
    blocks.push({ type: 'code', lang: codeLang || undefined, content: codeBuffer.join('\n') });
    codeBuffer = [];
    codeLang = '';
  };

  for (const line of lines) {
    const fence = line.match(/^```(\w+)?\s*$/);
    if (fence) {
      if (!inCode) {
        flushText();
        inCode = true;
        codeLang = fence[1] || '';
      } else {
        inCode = false;
        flushCode();
      }
      continue;
    }

    if (inCode) codeBuffer.push(line);
    else textBuffer.push(line);
  }

  if (inCode) {
    inCode = false;
    flushCode();
  }
  flushText();

  const renderInline = (content: string) => {
    const parts = content.split(/(`[^`]*`)/g).filter(Boolean);

    return parts.map((part, idx) => {
      if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
        const code = part.slice(1, -1);
        return (
          <code
            key={idx}
            className="mx-[1px] rounded-md border border-slate-200 bg-slate-50 px-1 py-[1px] text-[13px] leading-6 text-slate-900"
          >
            {code}
          </code>
        );
      }

      const tokens = part.split(/(https?:\/\/[^\s)]+|www\.[^\s)]+)/g).filter(Boolean);
      return tokens.map((tok, j) => {
        const isUrl = /^https?:\/\//i.test(tok) || /^www\./i.test(tok);
        if (isUrl) {
          const href = normalizeUrl(tok);
          return (
            <a
              key={`${idx}-${j}`}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 decoration-slate-300 hover:decoration-slate-500"
            >
              {tok}
            </a>
          );
        }
        return <span key={`${idx}-${j}`}>{tok}</span>;
      });
    });
  };

  const renderTextLines = (textLines: string[]) => {
    const nodes: React.ReactNode[] = [];
    let listBuffer: string[] = [];
    let paraBuffer: string[] = [];

    const flushList = () => {
      if (!listBuffer.length) return;
      const items = [...listBuffer];
      listBuffer = [];
      nodes.push(
        <ul key={`ul-${nodes.length}`} className="my-2 ml-5 list-disc space-y-1">
          {items.map((it, i) => (
            <li key={i} className="text-[15px] leading-7 text-current">
              {renderInline(it)}
            </li>
          ))}
        </ul>
      );
    };

    const flushPara = () => {
      if (!paraBuffer.length) return;
      const paragraph = paraBuffer.join(' ').trim();
      paraBuffer = [];
      if (!paragraph) return;

      nodes.push(
        <p key={`p-${nodes.length}`} className="my-2 text-[15px] leading-7 text-current">
          {renderInline(paragraph)}
        </p>
      );
    };

    for (const raw of textLines) {
      const line = raw ?? '';
      const trimmed = line.trim();

      if (!trimmed) {
        flushList();
        flushPara();
        nodes.push(<div key={`sp-${nodes.length}`} className="h-2" />);
        continue;
      }

      const h3 = trimmed.startsWith('### ');
      const h2 = trimmed.startsWith('## ');
      const h1 = trimmed.startsWith('# ');

      if (h1 || h2 || h3) {
        flushList();
        flushPara();
        const title = trimmed.replace(/^###\s|^##\s|^#\s/, '');

        nodes.push(
          <div
            key={`h-${nodes.length}`}
            className={
              h1
                ? 'mt-4 mb-1 text-[18px] font-semibold tracking-tight text-current'
                : h2
                  ? 'mt-4 mb-1 text-[16px] font-semibold tracking-tight text-current'
                  : 'mt-3 mb-1 text-[15px] font-semibold text-current'
            }
          >
            {renderInline(title)}
          </div>
        );
        continue;
      }

      const bullet = line.match(/^\s*[-*]\s+(.*)$/);
      if (bullet) {
        flushPara();
        listBuffer.push(bullet[1]);
        continue;
      }

      flushList();
      paraBuffer.push(trimmed);
    }

    flushList();
    flushPara();

    return <div className="text-current">{nodes}</div>;
  };

  return (
    <div className={className ? className : ''}>
      {blocks.map((b, i) => {
        if (b.type === 'code') {
          return (
            <div key={i} className="my-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 overflow-x-auto">
                <pre className="m-0 text-[12.5px] leading-6 text-slate-900">
                  <code>{b.content}</code>
                </pre>
              </div>
              {b.lang ? (
                <div className="mt-1 text-[11px] text-slate-400">{b.lang}</div>
              ) : null}
            </div>
          );
        }

        return (
          <div key={i} className="text-current">
            {renderTextLines(b.content)}
          </div>
        );
      })}
    </div>
  );
};

const FleetAssistant: React.FC<FleetAssistantProps> = ({ contextData, contextType, settings }) => {
  const {
    bookings,
    invoices,
    customers,
    leads,
    opportunities,
    leadActivities,
    auditLog,
    addBooking,
    logAuditEvent
  } = useData();

  const [isOpen, setIsOpen] = useState(false);

  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem(LAYOUT_STORAGE_KEY) : null;
    return stored === 'sidebar' ? 'sidebar' : 'floating';
  });

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text:
        "Hi there! I'm your Heartfledge AI Assistant. I can help with fleet management, CRM insights, financial analysis, and route optimization. What would you like to work on?"
    }
  ]);

  const [detailsByMessageId, setDetailsByMessageId] = useState<Record<string, DetailsEntry[]>>({});

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
  }, [messages, isLoading]);

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
          // Non-fatal: permission denied / unavailable location shouldn't break the assistant
          // error.code: 1=permission denied, 2=position unavailable, 3=timeout
          console.warn('Geolocation unavailable (non-fatal):', { code: error.code, message: error.message });
          setLocation(null);
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
      if (invoicesList.length > 3) lines.push(`…and ${invoicesList.length - 3} more.`);
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

  const persistLayout = (mode: LayoutMode) => {
    setLayoutMode(mode);
    try {
      window.localStorage.setItem(LAYOUT_STORAGE_KEY, mode);
    } catch {
      // ignore
    }
  };

  const handleSendMessage = async () => {
    if (input.trim() === '' || isLoading) return;

    const userText = input;
    const userMessage: Message = { id: Date.now().toString(), sender: 'user', text: userText };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const historyForCall = [...messages, userMessage].map((msg) => ({
      role: msg.sender === 'user' ? ('user' as const) : ('model' as const),
      parts: [{ text: msg.text }]
    }));

    try {
      const response = await getGeminiResponse(
        userText,
        historyForCall,
        contextData,
        contextType,
        location,
        { functionDeclarations: assistantTools, toolConfig: { functionCallingConfig: { mode: 'AUTO' } } }
      );

      const candidate = response.candidates?.[0];
      const parts = (candidate?.content?.parts as any[]) || [];
      const functionCall = parts.find((part) => part.functionCall)?.functionCall;

      if (functionCall?.name) {
        const toolName = functionCall.name;
        const toolArgs = functionCall.args || {};

        const toolResult = runAssistantTool(toolName, toolArgs, toolContext);

        if (logAuditEvent) {
          logAuditEvent({
            action: 'assistant.tool.call',
            entity: { type: mapToolToEntity(toolName), ref: toolName },
            meta: { args: toolArgs, ok: toolResult.ok, message: toolResult.message }
          });
        }

        const followUp = await getGeminiResponse(
          userText,
          historyForCall,
          contextData,
          contextType,
          location,
          {
            functionDeclarations: assistantTools,
            extraContents: [
              { role: 'model' as const, parts },
              {
                role: 'user' as const,
                parts: [
                  {
                    functionResponse: {
                      name: toolName,
                      response: toolResult,
                      id: functionCall.id
                    } as any
                  }
                ]
              }
            ]
          }
        );

        const groundingChunks =
          (followUp.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[]) || [];

        const finalMessageId = (Date.now() + 2).toString();
        const finalMessage: Message = {
          id: finalMessageId,
          sender: 'bot',
          text: followUp.text || toolResult.message,
          groundingChunks: groundingChunks.length > 0 ? groundingChunks : undefined
        };

        const detailsEntry: DetailsEntry[] = [
          {
            title: `Tool: ${toolName}`,
            body: [
              `Args:`,
              safeJsonStringify(toolArgs, 2000),
              '',
              `Result:`,
              formatToolResult(toolName, toolResult),
              '',
              `Raw result data (truncated):`,
              safeJsonStringify((toolResult as any)?.data, 2000)
            ].join('\n')
          }
        ];

        setDetailsByMessageId((prev) => ({ ...prev, [finalMessageId]: detailsEntry }));
        setMessages((prev) => [...prev, finalMessage]);
      } else {
        const groundingChunks =
          (response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[]) || [];

        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: response.text,
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
      initialData={
        { subject_line: emailDraft.subject, email_body: emailDraft.body, delay_days: 0, delay_hours: 0 } as any
      }
    />
  ) : null;

  if (!isOpen) {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="group fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full border border-transparent bg-gradient-to-br from-[#f5993b] via-[#f57f3a] to-[#f55a3a] shadow-lg shadow-orange-500/25 hover:shadow-xl transition flex items-center justify-center"
          aria-label="Open AI Assistant"
          title="Assistant"
        >
          <BoxTruckIconBold className="w-7 h-7 text-white drop-shadow-sm transition-transform group-hover:scale-105" />
        </button>
        {bookingModal}
        {emailComposerModal}
      </>
    );
  }

  const isSidebar = layoutMode === 'sidebar';

  const containerClass = isSidebar
    ? 'fixed inset-y-0 right-0 z-50 w-[420px] max-w-[92vw] bg-white border-l border-slate-200 shadow-2xl flex flex-col'
    : 'fixed bottom-6 right-6 z-50 w-[92vw] max-w-md h-[72vh] max-h-[720px] rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col';

  const headerClass = isSidebar ? 'px-5 py-4 border-b border-slate-200 bg-white' : 'px-5 py-4 border-b border-slate-200 bg-white';

  const bodyWrapperClass = isSidebar ? 'flex-1 overflow-y-auto bg-white' : 'flex-1 overflow-y-auto bg-white';

  const composerWrapperClass = isSidebar ? 'px-5 pb-5 pt-3 border-t border-slate-200 bg-white' : 'px-5 pb-5';

  return (
    <>
      <div className={containerClass}>
        <header className={headerClass}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center">
                <BoxTruckIconBold className="w-5 h-5 text-slate-800" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold tracking-tight text-slate-900 truncate">Assistant</div>
                <div className="text-xs text-slate-500 truncate">
                  {isSidebar ? 'Sidebar note mode' : 'Floating note mode'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => persistLayout(isSidebar ? 'floating' : 'sidebar')}
                className="h-9 px-3 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                title={isSidebar ? 'Switch to floating' : 'Switch to sidebar'}
              >
                {isSidebar ? 'Floating' : 'Sidebar'}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close assistant"
                title="Close"
                className="h-9 w-9 rounded-full border border-transparent hover:border-slate-200 hover:bg-slate-50 text-slate-600 transition flex items-center justify-center"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <div className={bodyWrapperClass}>
          <div className="px-5 py-5">
            <div className={isSidebar ? 'rounded-2xl border border-slate-200 bg-white overflow-hidden' : 'rounded-3xl border border-slate-200 bg-white overflow-hidden'}>
              <div className="divide-y divide-slate-200">
                {messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  const details = detailsByMessageId[msg.id] || [];

                  return (
                    <div key={msg.id} className="p-4">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="text-[11px] font-semibold tracking-wide text-slate-500">
                          {isUser ? 'YOU' : 'ASSISTANT'}
                        </div>
                        <div className="text-[11px] text-slate-400">{''}</div>
                      </div>

                      <div className="text-slate-900">
                        <NotesMarkdown text={msg.text} />
                      </div>

                      {!isUser && details.length > 0 ? (
                        <div className="mt-3">
                          <details className="group">
                            <summary className="cursor-pointer select-none text-xs font-semibold text-slate-600 hover:text-slate-800 inline-flex items-center gap-2">
                              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">
                                Details
                              </span>
                              <span className="text-[11px] text-slate-400 group-open:hidden">
                                (tool output)
                              </span>
                              <span className="text-[11px] text-slate-400 hidden group-open:inline">
                                (hide)
                              </span>
                            </summary>

                            <div className="mt-2 space-y-2">
                              {details.map((d, idx) => (
                                <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                  <div className="text-xs font-semibold text-slate-700">{d.title}</div>
                                  <pre className="mt-2 whitespace-pre-wrap break-words text-[12.5px] leading-6 text-slate-800 m-0">
{d.body}
                                  </pre>
                                </div>
                              ))}
                            </div>
                          </details>
                        </div>
                      ) : null}

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

        <div className={composerWrapperClass}>
          <div className={isSidebar ? 'rounded-2xl border border-slate-200 bg-white shadow-sm' : 'rounded-3xl border border-slate-200 bg-white shadow-sm'}>
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

              <div className="mt-3 flex flex-wrap gap-2 items-center">
                <button
                  type="button"
                  onClick={() => {
                    setMessages([{ id: '1', sender: 'bot', text: 'What would you like to work on?' }]);
                    setDetailsByMessageId({});
                  }}
                  className="text-xs px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition text-slate-700"
                  disabled={isLoading}
                  title="Start a new note"
                >
                  New note
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const transcript = messages
                      .map((m) => `${m.sender === 'user' ? 'You' : 'Assistant'}: ${m.text}`)
                      .join('\n\n');

                    const detailsLines: string[] = [];
                    for (const m of messages) {
                      const entries = detailsByMessageId[m.id];
                      if (!entries || entries.length === 0) continue;
                      detailsLines.push(`\n--- Details for message ${m.id} ---\n`);
                      entries.forEach((e) => {
                        detailsLines.push(`${e.title}\n${e.body}\n`);
                      });
                    }

                    const full = detailsLines.length ? `${transcript}\n\n${detailsLines.join('\n')}` : transcript;

                    if (navigator?.clipboard?.writeText) navigator.clipboard.writeText(full);
                  }}
                  className="text-xs px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition text-slate-700"
                  disabled={messages.length === 0}
                  title="Copy transcript (includes Details)"
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
