'use client';

import { useState } from 'react';
import { suggestEmail, normaliseEmail } from '../lib/emailTypo';

// "Wrong address? Fix it here" under the results. Updates the same Kit subscriber and re-sends the results.
export default function EmailFixBanner({ email, submissionId, exp, sig }: { email: string; submissionId: string; exp: string; sig: string }) {
  const [shown, setShown] = useState(email);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = normaliseEmail(value);
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch('/api/assessment/fix-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, exp, sig, newEmail: next }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg(data.error || 'Something went wrong. Please try again.'); return; }
      setShown(next);
      setDone(true);
      setOpen(false);
      window.posthog?.capture('email_fix_submitted');
    } catch {
      setMsg('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const hint = open && value ? suggestEmail(value) : null;
  return (
    <div role="status" aria-live="polite" style={{ maxWidth: 720, margin: '0 auto', padding: '12px 16px', fontSize: 14, textAlign: 'center' }}>
      {done ? <>Thanks, we&apos;ll send your results to <strong>{shown}</strong>.</> : <>We&apos;re sending your results to <strong>{shown}</strong>. </>}
      {!open && !done && (
        <button type="button" onClick={() => setOpen(true)} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--primary)', textDecoration: 'underline', fontWeight: 'bold', cursor: 'pointer' }}>
          Wrong address? Fix it here
        </button>
      )}
      {open && (
        <form onSubmit={submit} style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <input type="email" inputMode="email" autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} required
            className="input-field" style={{ maxWidth: 280 }} aria-label="Corrected email address" value={value} onChange={e => setValue(e.target.value)} disabled={busy} />
          <button type="submit" className="btn btn-start" disabled={busy}>{busy ? 'Saving…' : 'Update and resend'}</button>
          {hint && <div style={{ width: '100%' }}>Did you mean <button type="button" onClick={() => setValue(hint)} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--primary)', textDecoration: 'underline', fontWeight: 'bold', cursor: 'pointer' }}>{hint}</button>?</div>}
        </form>
      )}
      {msg && <div style={{ color: '#ef4444', marginTop: 6, fontWeight: 600 }}>{msg}</div>}
    </div>
  );
}
