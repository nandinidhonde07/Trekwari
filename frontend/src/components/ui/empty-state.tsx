import React from 'react';
import { Compass } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, actionLabel, onAction, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50/50 rounded-[20px] border border-dashed border-gray-200 min-h-[250px] animate-in fade-in duration-300">
      <div className="p-4 bg-orange-50 text-primary-orange rounded-full mb-4 animate-float-slow">
        {icon || <Compass className="h-8 w-8" />}
      </div>
      <h3 className="text-sm font-bold text-dark-charcoal mb-1.5">{title}</h3>
      <p className="text-xs text-gray-500 max-w-sm mb-6 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-primary-orange hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-button shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
