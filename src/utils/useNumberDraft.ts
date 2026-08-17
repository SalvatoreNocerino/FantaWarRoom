import { useState, useEffect, ChangeEvent } from 'react';

/**
 * Local text draft for a controlled numeric field. A plain
 * `value={n} onChange={e => onChange(Number(e.target.value))}` snaps back to
 * "0" on every keystroke while the field is empty (`Number('') === 0` fed
 * straight into the controlled `value`), which steals the cursor and makes
 * it impossible to just backspace and retype. This keeps whatever the user
 * is typing — including a transient empty string — and only re-syncs to the
 * committed value on blur.
 */
export function useNumberDraft(value: number, onChange: (n: number) => void) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  return {
    value: draft,
    onChange: (e: ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setDraft(raw);
      const parsed = Number(raw);
      if (raw.trim() !== '' && Number.isFinite(parsed)) {
        onChange(parsed);
      }
    },
    onBlur: () => setDraft(String(value)),
  };
}
