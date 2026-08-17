import React from 'react';
import { Input } from './Input';
import { useNumberDraft } from '../../utils/useNumberDraft';

type Variant = 'default' | 'mono' | 'money';

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value: number;
  onChange: (value: number) => void;
  variant?: Variant;
}

/** Drop-in replacement for `<Input type="number">` that doesn't snap to "0"
 * while the field is being cleared — see useNumberDraft. */
export const NumberInput: React.FC<NumberInputProps> = ({ value, onChange, onBlur, ...rest }) => {
  const draft = useNumberDraft(value, onChange);

  return (
    <Input
      type="number"
      value={draft.value}
      onChange={draft.onChange}
      onBlur={(e) => {
        draft.onBlur();
        onBlur?.(e);
      }}
      {...rest}
    />
  );
};
