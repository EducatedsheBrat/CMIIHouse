'use client';

import { useState } from 'react';
import { useToast } from '../shared/Toast';

/** The app doesn't send email — admins paste this into their own mail. */
export function inviteText(name: string) {
  const first = name.trim().split(/\s+/)[0] || 'there';
  const url = typeof window === 'undefined' ? '' : window.location.origin;
  return {
    subject: 'You’re on the CMII Den Points rolls',
    body: `Hi ${first},\n\nYou’ve been added to CMII Den Points. Go to ${url} and choose “Sign in with Google”, using your GSU email address (the one I added you with).\n\nIf Google offers more than one account, pick the GSU one.\n`,
  };
}

export function InviteMessage({ name, email }: { name: string; email: string }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const { subject, body } = inviteText(name);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast('Couldn’t copy — select the message and copy it by hand.', 'error');
    }
  };

  return (
    <div className="mt-3 rounded-lg border border-gold/25 bg-royal/50 p-3 animate-fade-up">
      <p className="mb-1.5 font-heading text-[10px] font-bold uppercase tracking-[0.16em] text-gold-light">Invite {name.trim()}</p>
      <pre className="whitespace-pre-wrap text-xs text-white/65">{body}</pre>
      <div className="mt-2 flex gap-2">
        <button type="button" className="btn btn-gold btn-sm" onClick={copy}>
          {copied ? 'Copied ✓' : 'Copy invite'}
        </button>
        <a className="btn btn-ghost btn-sm" href={`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}>
          Open in email
        </a>
      </div>
    </div>
  );
}
