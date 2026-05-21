/*
Small accessible modal used by the agency console.

- Backdrop click + Esc close it
- Focus is sent to the dialog on open
- Returns null when `open` is false (no portal needed; the styles use
  fixed positioning + a high z-index that sits above the sidebar)
*/

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  footer,
  children,
  size = "md",
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    // Focus the dialog so screen readers / keyboard users start inside.
    dialogRef.current?.focus();
    // Lock body scroll while open.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`modal-card modal-card--${size}`}
      >
        <div className="modal-head">
          <div>
            {title && <h2 id="modal-title" className="modal-title">{title}</h2>}
            {subtitle && <p className="modal-subtitle">{subtitle}</p>}
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} strokeWidth={2.2} />
          </button>
        </div>

        <div className="modal-body">{children}</div>

        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
