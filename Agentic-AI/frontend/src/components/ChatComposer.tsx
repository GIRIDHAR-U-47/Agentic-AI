import React, { useRef, useEffect } from 'react';

interface ChatComposerProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  isLoading?: boolean;
  disabled?: boolean;
  minRows?: number;
  maxRows?: number;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
  className?: string;
  id?: string;
  autoFocus?: boolean;
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = 'Ask R-Lens anything about your research...',
  isLoading = false,
  disabled = false,
  minRows = 1,
  leftAddon,
  rightAddon,
  className = '',
  id = 'chat-composer',
  autoFocus = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow height based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const nextHeight = Math.min(Math.max(textarea.scrollHeight, 44), 220);
    textarea.style.height = `${nextHeight}px`;
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading && !disabled) {
        onSubmit();
      }
    }
  };

  const canSubmit = Boolean(value.trim()) && !isLoading && !disabled;

  return (
    <div
      className={`relative flex flex-col bg-white border border-gray-200/90 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] focus-within:border-primary/80 focus-within:ring-2 focus-within:ring-primary/10 transition-all duration-150 ${className}`}
    >
      <div className="flex items-center gap-2 p-2">
        {leftAddon && <div className="flex items-center pl-1 shrink-0">{leftAddon}</div>}

        <textarea
          ref={textareaRef}
          id={id}
          value={value}
          rows={minRows}
          autoFocus={autoFocus}
          disabled={disabled || isLoading}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 max-h-[220px] bg-transparent border-0 resize-none py-2 px-2 text-[14.5px] text-gray-900 placeholder-gray-400 focus:outline-none leading-relaxed"
        />

        <div className="flex items-center gap-1.5 self-end pb-1 pr-1 shrink-0">
          {rightAddon}
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            id={`${id}-submit-btn`}
            title={isLoading ? 'Thinking...' : 'Send message (Enter)'}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer ${
              canSubmit
                ? 'bg-primary text-white hover:bg-primary-hover shadow-sm active:scale-95'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <div className="w-4 h-4 rounded-full border-2 border-white/60 border-t-white animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-[19px] leading-none">
                arrow_upward
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
