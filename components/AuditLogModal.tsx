import React from 'react';
import { ModalShell, ShellCard } from './UiKit';
import { useData } from '../contexts/DataContext';
import { ClockIcon } from './icons';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose }) => {
  const { auditLog = [], clearAuditLog } = useData();

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Audit Log"
      description="Recent system audit entries for bookings and other actions."
      icon={<ClockIcon className="w-5 h-5" />}
      maxWidthClass="max-w-2xl"
      footer={(
          <div className="flex items-center gap-2">
          <button className="text-sm text-slate-600 px-3 py-2 rounded-md bg-card border border-border" onClick={onClose}>Close</button>
          <button className="text-sm text-white bg-rose-600 px-3 py-2 rounded-md hover:bg-rose-700" onClick={() => { clearAuditLog?.(); }}>Clear Log</button>
        </div>
      )}
    >
      <div className="space-y-3 max-h-[60vh] overflow-auto">
        {auditLog.length === 0 ? (
          <div className="text-sm text-slate-500">No audit entries yet.</div>
        ) : (
          <ol className="space-y-2">
            {auditLog.slice().reverse().map((entry: any) => (
              <li key={entry.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900">{entry.action.replaceAll('.', ' ')}</div>
                    <div className="text-xs text-slate-500 mt-1">{entry.actor ? `${entry.actor.role ?? ''}${entry.actor?.role ? ' • ' : ''}${entry.actor?.name ?? ''}${entry.actor ? ' • ' : ''}` : ''}{new Date(entry.at).toLocaleString()}</div>
                  </div>
                  <div className="text-xs text-slate-500 text-right">
                    <div className="font-medium">{entry.entity?.type} #{entry.entity?.id}{entry.entity?.ref ? ` (${entry.entity.ref})` : ''}</div>
                  </div>
                </div>
                {entry.meta && (
                  <div className="mt-2 text-xs text-slate-600">{JSON.stringify(entry.meta)}</div>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </ModalShell>
  );
};

export default AuditLogModal;
