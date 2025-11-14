import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  message: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message }) => {
  return (
    <div className="flex items-center justify-center h-full bg-white rounded-xl shadow-md">
      <div className="text-center p-8">
        <div className="mx-auto h-24 w-24 text-gray-300">{icon}</div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">{message}</p>
      </div>
    </div>
  );
};

export default EmptyState;
```