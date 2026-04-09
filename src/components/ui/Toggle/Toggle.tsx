import React, { useState } from 'react';

interface ToggleProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
}

export const Toggle: React.FC<ToggleProps> = ({ checked = false, onChange, disabled = false, label }) => {
  const [isOn, setIsOn] = useState(checked);
  const toggle = () => {
    if (disabled) return;
    const next = !isOn;
    setIsOn(next);
    onChange?.(next);
  };
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        className={`relative w-10 h-5 rounded-full transition-all duration-200 focus:outline-none ${isOn ? 'bg-blue-600' : 'bg-navy-600 border border-white/10'} ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${isOn ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
      {label && <span className="text-sm text-silver-400">{label}</span>}
    </div>
  );
};
