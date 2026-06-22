'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export const dynamic = 'force-dynamic';

export default function Setup2FAPage() {
  const [factorId, setFactorId] = useState('');
  const [qrCodeSvg, setQrCodeSvg] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [enrollLoading, setEnrollLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function startEnrollment() {
      if (!supabase || !supabase.auth) {
        setErrorMsg('Supabase is not configured. Please define NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your deployment settings.');
        setEnrollLoading(false);
        return;
      }

      try {
        // 1. Fetch any existing factors to clean up unverified duplicates
        const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
        if (factorsError) {
          setErrorMsg(factorsError.message);
          setEnrollLoading(false);
          return;
        }

        const totpFactors = factorsData?.totp || [];
        const phoneFactors = factorsData?.phone || [];
        const allFactors = [...totpFactors, ...phoneFactors];

        // If a verified factor is already present, redirect to the dashboard
        const verifiedFactor = allFactors.find(f => f.status === 'verified');
        if (verifiedFactor) {
          router.push('/admin');
          return;
        }

        // Unenroll any dangling unverified factors from previous setup attempts
        const unverifiedFactors = allFactors.filter(f => f.status === 'unverified');
        for (const f of unverifiedFactors) {
          await supabase.auth.mfa.unenroll({ id: f.id });
        }

        // 2. Perform the fresh enrollment
        const { data, error } = await supabase.auth.mfa.enroll({
          factorType: 'totp',
          issuer: 'Online Speechie',
        });

        if (error) {
          setErrorMsg(error.message);
        } else if (data) {
          setFactorId(data.id);
          setQrCodeSvg(data.totp.qr_code);
          setSecret(data.totp.secret);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to initialize two-factor authentication setup.');
      } finally {
        setEnrollLoading(false);
      }
    }

    startEnrollment();
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
      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: code.trim(),
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg('Two-factor authentication successfully enabled. Redirecting...');
        setTimeout(() => {
          router.push('/admin');
        }, 1500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not verify the authenticator code. Please try again.');
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
      <div className="card-panel animate-fade-in" style={{ width: '100%', maxWidth: '480px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '12px', fontSize: '1.8rem' }}>Set Up Two-Factor Auth</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.95rem', lineHeight: '1.5' }}>
          Please scan the QR code below in your authenticator application (such as Google Authenticator, Authy, or 1Password) to enroll.
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

        {enrollLoading ? (
          <div style={{ padding: '40px', color: 'var(--text-muted)' }}>Generating QR Code...</div>
        ) : (
          factorId && (
            <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
              <div 
                style={{ 
                  background: '#ffffff', 
                  padding: '16px', 
                  borderRadius: '16px', 
                  border: '2px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '220px',
                  height: '220px'
                }}
                dangerouslySetInnerHTML={{ __html: qrCodeSvg.replace('<svg', '<svg style="width: 100%; height: 100%; display: block;"') }}
              />
              
              {secret && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Can't scan? Enter manually: <code style={{ background: '#E2E2D1', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.9rem', color: '#000' }}>{secret}</code>
                </div>
              )}

              <div className="input-group" style={{ width: '100%', marginBottom: 0, textAlign: 'left' }}>
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
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading || !!successMsg}>
                {loading ? 'Verifying...' : 'Verify and Activate'}
              </button>
            </form>
          )
        )}

        <div style={{ marginTop: '24px', borderTop: '2px solid var(--border-color)', paddingTop: '16px' }}>
          <button 
            onClick={handleSignOut} 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
          >
            Cancel and Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
