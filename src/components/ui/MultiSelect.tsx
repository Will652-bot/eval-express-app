import React from 'react';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  values: string[];
  onChange: (selectedValues: string[]) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  values,
  onChange,
  label,
  placeholder,
  className,
}) => {
  const handleToggle = (value: string) => {
    if (values.includes(value)) {
      onChange(values.filter((v) => v !== value));
    } else {
      if (values.length < 2) {
        onChange([...values, value]);
      }
    }
  };

  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <div className="grid grid-cols-1 gap-2">
        {options.map((opt) => {
          const selected = values.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              className={`px-4 py-2 border rounded-md text-sm font-medium text-left transition
                ${selected ? 'bg-primary-100 border-primary-500 text-primary-700' : 'bg-white border-gray-300 text-gray-700'}
                hover:bg-primary-50`}
              onClick={() => handleToggle(opt.value)}
            >
              {opt.label}
            </button>
          );
        })}
        {values.length === 2 && (
          <p className="text-xs text-gray-500 italic">⚠️ Máximo de 2 tipos permitidos.</p>
        )}
      </div>
    </div>
  );
};
