
import React from 'react';
import { ExclamationTriangleIcon } from './icons/Icons';
import { Button, ModalShell } from './UiKit';

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
  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={message}
      icon={
        <ExclamationTriangleIcon
          className={isDestructive ? 'h-5 w-5 text-rose-500' : 'h-5 w-5 text-amber-500'}
        />
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button variant={isDestructive ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {/* message is in description */}
    </ModalShell>
  );
};

export default ConfirmModal;
