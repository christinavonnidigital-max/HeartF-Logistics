
import React, { useState, useEffect } from 'react';
import { EmailSequence, SendCondition } from '../../types';
import { EnvelopeIcon, CloseIcon } from '../icons/Icons';
import { Button, Input, ModalShell, Select, Textarea } from '../UiKit';

interface EmailComposerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (sequence: any) => void;
  initialData?: EmailSequence | null;
}

const personalizationVariables = [
    { variable: '{{firstName}}', description: 'Lead\'s first name' },
    { variable: '{{lastName}}', description: 'Lead\'s last name' },
    { variable: '{{company}}', description: 'Lead\'s company name' },
    { variable: '{{position}}', description: 'Lead\'s job title' },
    { variable: '{{industry}}', description: 'Lead\'s industry' },
];

const EmailComposer: React.FC<EmailComposerProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [delayDays, setDelayDays] = useState(3);

    useEffect(() => {
        if (initialData) {
            setSubject(initialData.subject_line);
            setBody(initialData.email_body);
            setDelayDays(initialData.delay_days);
        } else {
            // Reset for new entry
            setSubject('');
            setBody('');
            setDelayDays(3);
        }
    }, [initialData, isOpen]);

    const handleSave = () => {
        const saveData = {
            ...(initialData || {}),
            step_name: `Email: ${subject.substring(0, 20)}...`,
            subject_line: subject,
            email_body: body,
            delay_days: delayDays,
            delay_hours: 0,
            send_condition: SendCondition.ALWAYS, // Default condition
            is_ab_test: false,
        };
        onSave(saveData);
    };

    if (!isOpen) return null;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit email step' : 'Add email step'}
      description="Write the email and choose when it should send."
      icon={<EnvelopeIcon className="h-5 w-5 text-brand-600" />}
      maxWidthClass="max-w-3xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>{initialData ? 'Save Changes' : 'Add Step'}</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground">Subject</label>
            <div className="mt-2">
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Quick question about your logistics ops" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Email body</label>
            <div className="mt-2">
              <Textarea rows={10} value={body} onChange={(e) => setBody(e.target.value)} placeholder={`Hi {{firstName}},\n\n...`} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground">Delay (days)</label>
              <div className="mt-2">
                <Input type="number" min={0} value={delayDays} onChange={(e) => setDelayDays(Number(e.target.value))} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Send condition</label>
              <div className="mt-2">
                <Select value={SendCondition.ALWAYS} onChange={() => {}}>
                  <option value={SendCondition.ALWAYS as any}>Always send</option>
                  <option value={SendCondition.IF_NOT_OPENED as any}>Only if no reply</option>
                </Select>
              </div>
            </div>
          </div>
        </div>
        <div className="md:col-span-1">
          <div className="rounded-2xl border border-border bg-muted p-4">
            <div className="text-sm font-semibold">Personalization</div>
            <p className="mt-1 text-sm text-foreground-muted">Click to insert into the email body.</p>
            <div className="mt-4 space-y-2">
              {personalizationVariables.map((v) => (
                <button
                  key={v.variable}
                  type="button"
                  onClick={() => setBody((prev) => `${prev}${prev && !prev.endsWith(' ') ? ' ' : ''}${v.variable} `)}
                  className="w-full text-left rounded-xl border border-border bg-card px-3 py-2 hover:bg-muted transition"
                >
                  <div className="text-sm font-medium text-foreground">{v.variable}</div>
                  <div className="text-xs text-foreground-muted">{v.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
};

export default EmailComposer;
