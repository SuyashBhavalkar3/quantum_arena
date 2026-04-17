"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type KeyboardEvent } from "react";

interface AutocompleteFieldProps {
  label: string;
  placeholder: string;
  value: string;
  suggestions: string[];
  icon: ComponentType<{ className?: string }>;
  onValueChange: (value: string) => void;
  onSelectionChange: (value: string | null) => void;
  selectedValue: string | null;
  inputClassName: string;
}

export default function AutocompleteField({
  label,
  placeholder,
  value,
  suggestions,
  icon: Icon,
  onValueChange,
  onSelectionChange,
  selectedValue,
  inputClassName,
}: AutocompleteFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [debouncedValue, setDebouncedValue] = useState(value);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // This debounces suggestion updates so both fields stay responsive while typing.
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedValue(value.trim());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [value]);

  // This closes the dropdown only for true outside clicks so input state is preserved.
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const filteredSuggestions = useMemo(() => {
    const query = debouncedValue.toLowerCase();
    const matches = query
      ? suggestions.filter((suggestion) => suggestion.toLowerCase().includes(query))
      : suggestions;

    return matches.slice(0, 8);
  }, [debouncedValue, suggestions]);

  // This resets keyboard focus to the current result set so Enter always selects the intended item.
  useEffect(() => {
    setHighlightedIndex(filteredSuggestions.length > 0 ? 0 : -1);
  }, [filteredSuggestions]);

  const selectSuggestion = useCallback(
    (suggestion: string) => {
      onValueChange(suggestion);
      onSelectionChange(suggestion);
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    },
    [onSelectionChange, onValueChange]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (!showSuggestions && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
        setShowSuggestions(true);
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setHighlightedIndex((current) =>
          filteredSuggestions.length === 0 ? -1 : Math.min(current + 1, filteredSuggestions.length - 1)
        );
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlightedIndex((current) => Math.max(current - 1, 0));
      }

      if (event.key === "Enter" && showSuggestions && highlightedIndex >= 0) {
        event.preventDefault();
        const selected = filteredSuggestions[highlightedIndex];
        if (selected) {
          selectSuggestion(selected);
        }
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setShowSuggestions(false);
      }
    },
    [filteredSuggestions, highlightedIndex, selectSuggestion, showSuggestions]
  );

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-xs font-medium text-[#5A534A] dark:text-slate-400 mb-1.5">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A69A8C]" />
        <input
          className={`${inputClassName} pl-10`}
          placeholder={placeholder}
          value={value}
          onChange={(event) => {
            const nextValue = event.target.value;
            onValueChange(nextValue);
            onSelectionChange(nextValue === selectedValue ? selectedValue : null);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          aria-expanded={showSuggestions}
          aria-autocomplete="list"
          aria-haspopup="listbox"
        />
      </div>

      {selectedValue && <p className="mt-1.5 text-[11px] text-emerald-600">Selected: {selectedValue}</p>}

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-[#E8E0D6] dark:border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden"
          role="listbox"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              // This uses mousedown to beat input blur so suggestion clicks never get dropped.
              onMouseDown={(event) => {
                event.preventDefault();
                selectSuggestion(suggestion);
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                index === highlightedIndex
                  ? "bg-[#F5F0EA] dark:bg-slate-800 text-[#2D2A24] dark:text-white"
                  : "hover:bg-[#F5F0EA] dark:hover:bg-slate-800 text-[#2D2A24] dark:text-white"
              }`}
              role="option"
              aria-selected={index === highlightedIndex}
            >
              <span className="w-7 h-7 rounded-lg bg-[#B8915C]/10 flex items-center justify-center text-[#B8915C] font-bold text-xs flex-shrink-0">
                {suggestion[0]}
              </span>
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
