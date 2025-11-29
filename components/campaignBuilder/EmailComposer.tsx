
import React, { useState, useEffect } from 'react';
import { EmailSequence, SendCondition } from '../../types';
import { CloseIcon } from '../icons/Icons';

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
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex justify-center items-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <header className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">{initialData ? 'Edit Email Step' : 'Add New Email Step'}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
            <CloseIcon className="w-6 h-6 text-gray-600" />
          </button>
        </header>

        <main className="p-6 flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subject</label>
              <input
                type="text"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                placeholder="Your email subject line"
              />
            </div>
            <div>
              <label htmlFor="body" className="block text-sm font-medium text-gray-700">Email Body</label>
              <textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={12}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                placeholder="Write your email here. Use variables for personalization."
              />
            </div>
            <div>
              <label htmlFor="delay" className="block text-sm font-medium text-gray-700">Delay</label>
              <div className="mt-1 flex items-center space-x-2 flex-wrap gap-y-2">
                <span>Wait</span>
                <input
                  type="number"
                  id="delay"
                  value={delayDays}
                  onChange={(e) => setDelayDays(parseInt(e.target.value, 10) || 0)}
                  className="w-24 max-w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                />
                <span>days before sending this email.</span>
              </div>
            </div>
          </div>
          <div className="col-span-1 bg-gray-50 p-4 rounded-lg border">
              <h4 className="font-semibold text-sm mb-2">Personalization Variables</h4>
              <ul className="space-y-2">
                  {personalizationVariables.map(v => (
                      <li key={v.variable} className="text-xs">
                          <code className="bg-gray-200 p-1 rounded font-mono text-gray-800">{v.variable}</code>
                          <p className="text-gray-500">{v.description}</p>
                      </li>
                  ))}
              </ul>
          </div>
        </main>

        <footer className="p-4 bg-gray-50 border-t flex justify-end space-x-3">
          <button onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSave} className="bg-orange-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-orange-700">
            {initialData ? 'Save Changes' : 'Add Step'}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default EmailComposer;
