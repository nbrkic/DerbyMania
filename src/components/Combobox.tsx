import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { normalizeForSearch } from '../lib/text';

export type ComboboxOption = { id: number | string; name: string };

type ComboboxProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  disabled?: boolean;
  noResultsLabel?: string;
  maxResults?: number;
};

/** Free-text input with a filtered, typeahead dropdown. Filtering ignores case,
 * diacritics and đ/dj so "Panc" matches "Pančevo". Options are shown in the
 * order they're passed in (starts-with matches first, then contains-matches). */
export function Combobox({
  id,
  value,
  onChange,
  options,
  placeholder,
  disabled,
  noResultsLabel = 'Nema poklapanja',
  maxResults = 50,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [menuRect, setMenuRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const query = normalizeForSearch(value);
    if (!query) return options.slice(0, maxResults);

    const starts: ComboboxOption[] = [];
    const contains: ComboboxOption[] = [];
    for (const o of options) {
      const normalized = normalizeForSearch(o.name);
      if (normalized.startsWith(query)) starts.push(o);
      else if (normalized.includes(query)) contains.push(o);
    }
    return [...starts, ...contains].slice(0, maxResults);
  }, [value, options, maxResults]);

  useEffect(() => {
    setHighlighted(0);
  }, [value, open]);

  useEffect(() => {
    if (!open) return;

    function updatePosition() {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMenuRect({ top: rect.bottom + 8, left: rect.left, width: rect.width });
    }

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (containerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [open]);

  function pick(option: ComboboxOption) {
    onChange(option.name);
    setOpen(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      if (open && filtered[highlighted]) {
        e.preventDefault();
        pick(filtered[highlighted]);
      }
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        id={id}
        type="text"
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        value={value}
        disabled={disabled}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="field-input w-full pb-2.5 text-base"
      />

      {open &&
        menuRect &&
        !disabled &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-50 bg-ink-900 border border-red-500/30 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.85)] py-1 max-h-64 overflow-y-auto overscroll-contain"
            style={{ top: menuRect.top, left: menuRect.left, width: menuRect.width }}
          >
            {filtered.length === 0 ? (
              <p className="px-4 py-2.5 text-sm text-paper-500">{noResultsLabel}</p>
            ) : (
              filtered.map((o, i) => (
                <button
                  key={o.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(o)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    i === highlighted
                      ? 'bg-red-500 text-paper-100 font-semibold'
                      : 'text-paper-300 hover:bg-red-500/20 hover:text-paper-100'
                  }`}
                >
                  {o.name}
                </button>
              ))
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
