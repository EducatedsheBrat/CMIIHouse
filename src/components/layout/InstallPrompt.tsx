'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { Crest } from '../shared/Crest';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Window {
    /** Captured by the inline script in app/layout.tsx, which runs before React hydrates. */
    __lqInstallPrompt?: BeforeInstallPromptEvent;
  }
}

const DISMISS_KEY = 'lq-install-dismissed';

function wasDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    return Date.now() - at < 1000 * 60 * 60 * 24 * 14; // two weeks
  } catch {
    return false;
  }
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

const PROMPT_CHANGED = 'lq-install-prompt-changed';

/** The captured beforeinstallprompt event, as external state. */
function subscribePrompt(onChange: () => void) {
  const onPrompt = (e: Event) => {
    e.preventDefault();
    window.__lqInstallPrompt = e as BeforeInstallPromptEvent;
    onChange();
  };
  window.addEventListener('beforeinstallprompt', onPrompt);
  window.addEventListener(PROMPT_CHANGED, onChange);
  return () => {
    window.removeEventListener('beforeinstallprompt', onPrompt);
    window.removeEventListener(PROMPT_CHANGED, onChange);
  };
}

const noSubscribe = () => () => undefined;

function isIosSafari() {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS/.test(ua);
}

/** Mobile install banner: native prompt on Android/Chrome, instructions on iOS Safari. */
export function InstallPrompt() {
  // Browser-only facts come from useSyncExternalStore so the server render (hidden) matches hydration.
  const deferred = useSyncExternalStore(subscribePrompt, () => window.__lqInstallPrompt ?? null, () => null);
  const blocked = useSyncExternalStore(noSubscribe, () => isStandalone() || wasDismissed(), () => true);
  const ios = useSyncExternalStore(noSubscribe, isIosSafari, () => false);
  const [dismissedNow, setDismissedNow] = useState(false);
  const [iosReady, setIosReady] = useState(false);

  useEffect(() => {
    if (!ios || blocked) return;
    const timer = setTimeout(() => setIosReady(true), 4000);
    return () => clearTimeout(timer);
  }, [ios, blocked]);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* storage unavailable */
    }
    setDismissedNow(true);
  };

  if (blocked || dismissedNow || (!deferred && !iosReady)) return null;

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    window.__lqInstallPrompt = undefined;
    window.dispatchEvent(new Event(PROMPT_CHANGED));
    setDismissedNow(true);
  };

  return (
    <div className="fixed inset-x-3 bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] z-40 animate-fade-up md:bottom-6 md:left-auto md:right-6 md:w-96">
      <div className="parchment flex items-center gap-3 p-4">
        <Crest size={34} />
        <div className="min-w-0 flex-1">
          <p className="font-heading text-sm font-bold">Install House Points</p>
          {deferred ? (
            <p className="text-xs text-parchment-ink/70">Add it to your home screen for one-tap point awards.</p>
          ) : (
            <p className="text-xs text-parchment-ink/70">
              Tap <strong>Share</strong> then <strong>Add to Home Screen</strong>.
            </p>
          )}
        </div>
        {deferred && (
          <button type="button" onClick={install} className="btn btn-sm btn-color" style={{ ['--btn' as string]: '#1A2940', color: '#fff' }}>
            Install
          </button>
        )}
        <button type="button" onClick={dismiss} className="p-1 text-lg leading-none text-parchment-ink/50 hover:text-parchment-ink" aria-label="Dismiss">
          ×
        </button>
      </div>
    </div>
  );
}
