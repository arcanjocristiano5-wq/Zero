import React from 'react';
import { IconWand } from './Icons';

export interface Suggestion {
  lineNumber: number;
  suggestion: string;
  replacementCode: string;
}

interface SuggestionPopoverProps {
  suggestion: Suggestion;
  top: number;
  left: number;
  onApply: (suggestion: Suggestion) => void;
  onDismiss: () => void;
}

const SuggestionPopover: React.FC<SuggestionPopoverProps> = ({ suggestion, top, left, onApply, onDismiss }) => {
  return (
    <div
      className="fixed z-50 w-64 bg-zinc-800 border border-zinc-700 rounded-lg shadow-2xl animate-in fade-in zoom-in-95"
      style={{ top: `${top}px`, left: `${left}px` }}
    >
      <div className="p-3 border-b border-zinc-700">
        <h4 className="flex items-center gap-2 text-xs font-bold text-violet-400">
          <IconWand size={14} />
          Sugestão da IA
        </h4>
      </div>
      <div className="p-3 text-xs text-zinc-300">
        {suggestion.suggestion}
      </div>
      <div className="p-2 bg-zinc-900/50 flex justify-end gap-2">
        <button
          onClick={onDismiss}
          className="px-2 py-1 text-[10px] font-bold text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-md transition-colors"
        >
          Ignorar
        </button>
        <button
          onClick={() => onApply(suggestion)}
          className="px-2 py-1 text-[10px] font-bold bg-violet-600 text-white hover:bg-violet-700 rounded-md transition-colors"
        >
          Aplicar
        </button>
      </div>
    </div>
  );
};

export default SuggestionPopover;
