
import React from 'react';
import { ShellCard } from './UiKit';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  message: string;
}

// FIX: Changed component definition to use React.FC to resolve "Cannot find namespace 'JSX'" error.
const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message }) => {
  return (
    <ShellCard className="flex items-center justify-center h-full">
      <div className="text-center p-8">
        <div className="mx-auto h-24 w-24 text-gray-300">{icon}</div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">{message}</p>
      </div>
    </ShellCard>
  );
};

export default EmptyState;
