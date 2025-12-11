
import React from 'react';
import { CloseIcon, ExclamationTriangleIcon } from './icons/Icons';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  isDestructive = true,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 flex items-start gap-4">
          <div className={`flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-full ${isDestructive ? 'bg-red-100' : 'bg-orange-100'}`}>
            <ExclamationTriangleIcon className={`h-6 w-6 ${isDestructive ? 'text-red-600' : 'text-orange-600'}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 leading-6">{title}</h3>
            <p className="mt-2 text-sm text-gray-500">{message}</p>
          </div>
        </div>
        <div className="bg-gray-50 px-6 py-4 flex flex-row-reverse gap-3">
          <button
            type="button"
            className={`inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-base font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                : 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
            }`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 sm:text-sm"
            onClick={onClose}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
