import type { JSX } from "preact";

interface EditorProps {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

export function Editor({ value, disabled = false, onChange }: EditorProps) {
  const handleKeyDown = (event: JSX.TargetedKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Tab") {
      return;
    }

    event.preventDefault();
    const textarea = event.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const indentation = "  ";
    const nextValue = `${value.slice(0, start)}${indentation}${value.slice(end)}`;
    onChange(nextValue);

    requestAnimationFrame(() => {
      textarea.selectionStart = start + indentation.length;
      textarea.selectionEnd = start + indentation.length;
    });
  };

  return (
    <label className="editor-surface">
      <span className="sr-only">Paste contents</span>
      <textarea
        aria-label="Paste contents"
        value={value}
        disabled={disabled}
        spellcheck={false}
        onInput={(event) => onChange(event.currentTarget.value)}
        onKeyDown={handleKeyDown}
        placeholder="Start typing…"
      />
    </label>
  );
}
