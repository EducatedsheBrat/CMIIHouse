'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Spinner } from './States';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  tone?: 'default' | 'danger';
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}

/** A parchment decree for confirming consequential actions. */
export function ConfirmDialog({ open, ...props }: ConfirmDialogProps) {
  // Mounting the dialog only while open gives every opening fresh busy/error state.
  return open ? <Dialog {...props} /> : null;
}

function Dialog({ title, children, confirmLabel = 'Confirm', tone = 'default', onConfirm, onClose }: Omit<ConfirmDialogProps, 'open'>) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-royal-night/80 p-4 backdrop-blur-sm animate-fade-in sm:items-center" onClick={() => !busy && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="parchment w-full max-w-md p-6 animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="font-display text-xl font-bold text-parchment-ink">
          {title}
        </h2>
        <div className="my-3 h-px bg-gradient-to-r from-transparent via-gold-dark/60 to-transparent" />
        <div className="text-sm leading-relaxed text-parchment-ink/85">{children}</div>
        {error && <p className="mt-3 rounded-md bg-red-700/10 px-3 py-2 text-sm text-red-800">{error}</p>}
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" className="font-heading text-xs font-bold uppercase tracking-[0.14em] text-parchment-ink/60 hover:text-parchment-ink" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-color"
            style={{ ['--btn' as string]: tone === 'danger' ? '#B83A3A' : '#1A2940', color: '#fff' }}
            onClick={run}
            disabled={busy}
          >
            {busy && <Spinner size={14} className="border-white/30 border-t-white" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
