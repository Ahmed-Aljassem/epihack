/*
Tag/chip input.

Type a value, press Enter or comma to commit. Backspace on an empty
input removes the previous tag. Each tag has a small "x" to remove.

Pure controlled component — parent owns the array.
*/

import { useRef, useState } from "react";
import { X } from "lucide-react";

export default function TagInput({
  values,
  onChange,
  placeholder = "Type and press Enter…",
  inputMode,
  pattern,
  helpText,
}) {
  const inputRef = useRef(null);
  const [draft, setDraft] = useState("");

  const commit = (raw) => {
    const next = (raw || draft).trim().replace(/,$/, "");
    if (!next) return;
    if (values.includes(next)) {
      setDraft("");
      return;
    }
    onChange([...values, next]);
    setDraft("");
  };

  const remove = (v) => {
    onChange(values.filter((x) => x !== v));
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && !draft && values.length > 0) {
      e.preventDefault();
      remove(values[values.length - 1]);
    }
  };

  return (
    <div>
      <div
        className="tag-input"
        onClick={() => inputRef.current?.focus()}
      >
        {values.map((v) => (
          <span key={v} className="tag-chip">
            <span>{v}</span>
            <button
              type="button"
              className="tag-chip-x"
              onClick={(e) => { e.stopPropagation(); remove(v); }}
              aria-label={`Remove ${v}`}
            >
              <X size={10} strokeWidth={2.6} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          className="tag-input-field"
          value={draft}
          onChange={(e) => {
            const v = e.target.value;
            if (v.endsWith(",")) commit(v.slice(0, -1));
            else setDraft(v);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => draft && commit()}
          placeholder={values.length === 0 ? placeholder : ""}
          inputMode={inputMode}
          pattern={pattern}
        />
      </div>
      {helpText && <div className="tag-input-help">{helpText}</div>}
    </div>
  );
}
