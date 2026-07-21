import { useEffect, useRef, useState } from 'react';

type DropdownOption = { value: string; label: string };

type DropdownProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  triggerClassName?: string;
};

export function Dropdown({ id, value, onChange, options, placeholder, triggerClassName }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function pick(optionValue: string) {
    onChange(optionValue);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        id={id}
        onClick={() => setOpen((v) => !v)}
        className={triggerClassName ?? 'field-input w-full pb-2.5 text-base text-left flex items-center justify-between gap-3'}
      >
        <span className={selected ? 'text-paper-100' : 'text-[rgba(244,235,225,0.3)]'}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`w-4 h-4 text-red-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full bg-ink-900 border border-red-500/30 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.85)] py-1 max-h-64 overflow-y-auto">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => pick(o.value)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                o.value === value ? 'bg-red-500 text-paper-100 font-semibold' : 'text-paper-300 hover:bg-red-500/20 hover:text-paper-100'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
