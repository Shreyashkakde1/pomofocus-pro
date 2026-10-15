import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Bookmark, Send, X, Clock } from 'lucide-react';

export const ContextCheckpointPrompt: React.FC = () => {
  const isPromptOpen = useStore((s) => s.isCheckpointPromptOpen);
  const promptPreviousTask = useStore((s) => s.promptPreviousTask);
  const closeCheckpointPrompt = useStore((s) => s.closeCheckpointPrompt);
  const submitCheckpointNote = useStore((s) => s.submitCheckpointNote);

  const [note, setNote] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isPromptOpen) {
      setNote('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isPromptOpen]);

  if (!isPromptOpen || !promptPreviousTask) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (note.trim()) {
      submitCheckpointNote(note.trim());
    } else {
      closeCheckpointPrompt();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full px-4 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="p-5 rounded-2xl border border-black/10 bg-white shadow-[0_20px_50px_rgba(17,19,24,0.12)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-amber-100 text-amber-800">
              <Bookmark className="h-3.5 w-3.5 fill-amber-700/20" />
            </span>
            <span className="text-xs font-bold text-[#111318] uppercase tracking-wider">
              Where I Left Off
            </span>
          </div>
          <button
            onClick={closeCheckpointPrompt}
            className="text-slate-400 hover:text-[#111318] p-1 rounded-lg hover:bg-black/5 transition-colors"
            title="Dismiss [Esc]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Task Context */}
        <p className="text-xs text-tercelet-muted mb-3 leading-relaxed">
          Switched away from <span className="text-[#111318] font-bold">"{promptPreviousTask.title}"</span>. Leave a note for when you resume:
        </p>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="e.g. Solved LRU cache; next implement tests..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="flex-1 bg-[#fcfbf8] border border-black/15 focus:border-tercelet-brand rounded-xl px-3.5 py-2 text-xs text-[#111318] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-tercelet-brand/20 transition-all font-sans"
          />
          <button
            type="submit"
            className="h-9 px-4 bg-tercelet-brand hover:bg-tercelet-brandHover text-white rounded-xl font-semibold text-xs transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Save</span>
          </button>
        </form>

        {/* Footer info */}
        <div className="flex items-center justify-between mt-2.5 text-[10px] text-tercelet-muted pt-2 border-t border-black/[0.06]">
          <span className="flex items-center gap-1 text-tercelet-brand font-medium">
            <Clock className="h-3 w-3" />
            <span>Timer continues ticking</span>
          </span>
          <span className="font-mono">[Enter] Save • [Esc] Skip</span>
        </div>
      </div>
    </div>
  );
};
