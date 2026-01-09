import React, { useEffect, useState } from 'react';
import { ModalShell } from './UiKit';
import { ClockIcon } from './icons';

type AuditEntry = {
  id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  meta: any;
  created_at: string;
  actor_email: string | null;
  actor_first_name: string | null;
  actor_last_name: string | null;
};

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose }) => {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const safeJson = async (res: Response) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error('Unexpected response. Make sure Netlify functions are running.');
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    let active = true;

    const fetchAudit = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/.netlify/functions/audit-log?limit=50', {
          credentials: 'include',
        });
        const data = await safeJson(res);
        if (!res.ok || !data?.ok) throw new Error(data?.error || 'Failed to load audit log');
        if (!active) return;
        setEntries(data.entries || []);
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || 'Failed to load audit log');
        setEntries([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchAudit();

    return () => {
      active = false;
    };
  }, [isOpen]);

  const formatActor = (entry: AuditEntry) => {
    const name = `${entry.actor_first_name || ''} ${entry.actor_last_name || ''}`.trim();
    if (name && entry.actor_email) return `${name} (${entry.actor_email})`;
    return name || entry.actor_email || 'unknown';
  };

  const formatTarget = (entry: AuditEntry) => {
    if (!entry.target_type) return '';
    if (!entry.target_id) return entry.target_type;
    return `${entry.target_type} #${entry.target_id.slice(0, 8)}`;
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleString();
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Audit Log"
      description="Recent system audit entries for access changes and actions."
      icon={<ClockIcon className="w-5 h-5" />}
      maxWidthClass="max-w-2xl"
      footer={(
        <div className="flex items-center gap-2">
          <button className="text-sm text-slate-600 px-3 py-2 rounded-md bg-card border border-border" onClick={onClose}>
            Close
          </button>
        </div>
      )}
    >
      <div className="space-y-3 max-h-[60vh] overflow-auto">
        {loading ? (
          <div className="text-sm text-slate-500">Loading...</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : entries.length === 0 ? (
          <div className="text-sm text-slate-500">No audit entries yet.</div>
        ) : (
          <ol className="space-y-2">
            {entries.map((entry) => (
              <li key={entry.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900">
                      {entry.action.replaceAll('.', ' ')}
                      {entry.meta?.role ? <span className="text-slate-500"> - {String(entry.meta.role)}</span> : null}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {formatActor(entry)}{formatTarget(entry) ? ` - ${formatTarget(entry)}` : ''}
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 text-right">
                    <div className="font-medium">{formatTime(entry.created_at)}</div>
                  </div>
                </div>
                {entry.meta ? (
                  <div className="mt-2 text-xs text-slate-600">{JSON.stringify(entry.meta)}</div>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </div>
    </ModalShell>
  );
};

export default AuditLogModal;
