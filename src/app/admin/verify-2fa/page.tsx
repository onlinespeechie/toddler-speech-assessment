'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export const dynamic = 'force-dynamic';

export default function Verify2FAPage() {
  const [factorId, setFactorId] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkLoading, setCheckLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkFactors() {
      if (!supabase || !supabase.auth) {
        setErrorMsg('Supabase is not configured. Please define NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your deployment settings.');
        setCheckLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.auth.mfa.listFactors();
        if (error) {
          setErrorMsg(error.message);
        } else if (data) {
          const verifiedFactors = [...(data.totp || []), ...(data.phone || [])].filter(
            f => f.status === 'verified'
          );

          if (verifiedFactors.length > 0) {
            setFactorId(verifiedFactors[0].id);
          } else {
            // No active factor verified yet, redirect to setup
            router.push('/admin/setup-2fa');
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setErrorMsg(message || 'Failed to check verification settings.');
      } finally {
        setCheckLoading(false);
      }
    }

    checkFactors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId) return;

    if (!supabase || !supabase.auth) {
      setErrorMsg('Supabase is not configured. Please define NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your deployment settings.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: code.trim(),
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg('Security code verified. Redirecting...');
        setTimeout(() => {
          window.location.href = '/admin';
        }, 1500);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setErrorMsg(message || 'Verification failed. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-main)', padding: '20px' }}>
      <div className="card-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '12px', fontSize: '1.8rem' }}>Two-Factor Security</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.95rem', lineHeight: '1.5' }}>
          Please enter the 6-digit verification code from your authenticator application to continue.
        </p>

        {errorMsg && (
          <div style={{ 
            backgroundColor: '#fef2f2', 
            border: '2px solid #ef4444', 
            color: '#b91c1c', 
            padding: '12px', 
            borderRadius: '12px', 
            marginBottom: '16px', 
            fontWeight: 600,
            fontSize: '0.9rem' 
          }}>
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div style={{ 
            backgroundColor: '#f0fdf4', 
            border: '2px solid #10b981', 
            color: '#15803d', 
            padding: '12px', 
            borderRadius: '12px', 
            marginBottom: '16px', 
            fontWeight: 600,
            fontSize: '0.9rem' 
          }}>
            {successMsg}
          </div>
        )}

        {checkLoading ? (
          <div style={{ padding: '20px', color: 'var(--text-muted)' }}>Checking authentication factors...</div>
        ) : (
          factorId && (
            <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="input-group" style={{ marginBottom: 0, textAlign: 'left' }}>
                <label className="input-label">Verification Code</label>
                <input 
                  type="text" 
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000" 
                  className="input-field" 
                  style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.5rem', fontWeight: 'bold' }}
                  value={code} 
                  onChange={e => setCode(e.target.value.replace(/[^0-9]/g, ''))} 
                  required
                  autoFocus
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading || !!successMsg}>
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </form>
          )
        )}

        <div style={{ marginTop: '24px', borderTop: '2px solid var(--border-color)', paddingTop: '16px' }}>
          <button 
            onClick={handleSignOut} 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
