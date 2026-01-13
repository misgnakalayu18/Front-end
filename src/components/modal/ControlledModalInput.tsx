// ControlledModalInput.tsx
import React from 'react';
import { Input } from 'antd';

interface ControlledModalInputProps {
  name: string;
  value: string | number | undefined;
  onChange: (name: string, value: string | number | undefined) => void;
  label: string;
  type?: string;
  step?: string;
  min?: string;
}

const ControlledModalInput: React.FC<ControlledModalInputProps> = ({
  name,
  value,
  onChange,
  label,
  type = 'text',
  step,
  min
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value: inputValue } = e.target;
    
    if (type === 'number' || name === 'price' || name === 'qty') {
      if (inputValue === '' || inputValue === null || inputValue === undefined) {
        onChange(name, undefined);
      } else {
        const num = type === 'number' ? parseFloat(inputValue) : parseInt(inputValue, 10);
        onChange(name, isNaN(num) ? undefined : num);
      }
    } else {
      onChange(name, inputValue);
    }
  };

  const displayValue = value === undefined || value === null ? '' : String(value);

  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', marginBottom: '0.5rem' }}>
        {label}
      </label>
      <Input
        type={type}
        name={name}
        value={displayValue}
        onChange={handleInputChange}
        step={step}
        min={min}
      />
    </div>
  );
};

export default ControlledModalInput;