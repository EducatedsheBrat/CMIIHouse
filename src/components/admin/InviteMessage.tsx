'use client';

import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../shared/Toast';

/** The app doesn't send email — admins paste this into their own mail. */
export function inviteText(name: string, kind: 'student' | 'staff' = 'staff', sender = '') {
  const first = name.trim().split(/\s+/)[0] || 'there';
  const url = typeof window === 'undefined' ? '' : window.location.origin;
  if (kind === 'student') {
    return {
      subject: 'You’re on the CMII Den Points rolls',
      body: `Hi ${first},\n\nYou’ve been added to CMII Den Points, the house points system for the Creative Media Industries Institute.\n\nTo sign in:\n\n1. Go to ${url}\n2. Click “Sign in with Google”\n3. Choose the email this message was sent to (GSU or Gmail).\n\nYou’ll start out unsorted. At the sorting ceremony you’ll be placed in one of four houses: Lumina, Doron, Asé or Kaizen. After that, you’ll earn points for your house and can see the leaderboard and your own progress.\n\nIf you see a “not on the house rolls” message, reply to this email and I’ll check that your address matches.\n\n${sender}\n`,
    };
  }
  return {
    subject: 'You’re on the CMII Den Points rolls',
    body: `Hi ${first},\n\nYou’ve been added to CMII Den Points. Go to ${url}, click “Sign in with Google”, and choose the email I added you with.\n\nIf Google offers more than one account, pick that one.\n`,
  };
}

export function InviteMessage({ name, email, kind = 'staff' }: { name: string; email: string; kind?: 'student' | 'staff' }) {
  const toast = useToast();
  const { profile } = useAuth();
  const [copied, setCopied] = useState(false);
  const { subject, body } = inviteText(name, kind, profile?.displayName);

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
