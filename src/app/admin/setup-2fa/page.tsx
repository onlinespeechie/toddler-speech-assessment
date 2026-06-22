'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export const dynamic = 'force-dynamic';

interface MFAFactor {
  id: string;
  factor_type: string;
  status: string;
}

export default function Setup2FAPage() {
  const [factorId, setFactorId] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [enrollLoading, setEnrollLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [debugFactors, setDebugFactors] = useState<MFAFactor[]>([]);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let active = true;

    async function startEnrollment() {
      if (!supabase || !supabase.auth) {
        if (active) {
          setErrorMsg('Supabase is not configured. Please define NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your deployment settings.');
          setEnrollLoading(false);
        }
        return;
      }

      try {
        // 1. Fetch any existing factors to clean up unverified duplicates
        const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
        if (factorsError) {
          if (active) {
            setErrorMsg(factorsError.message);
            setEnrollLoading(false);
          }
          return;
        }

        const allFactors = (Array.isArray(factorsData)
          ? factorsData
          : [
              ...(factorsData?.all || []),
              ...(factorsData?.totp || []),
              ...(factorsData?.phone || [])
            ].filter((f, index, self) => self.findIndex(t => t.id === f.id) === index)) as MFAFactor[]; // De-duplicate

        if (active) {
          setDebugFactors(allFactors);
        }

        // If a verified factor is already present, redirect to the dashboard
        const verifiedFactor = allFactors.find(f => f.status === 'verified');
        if (verifiedFactor) {
          if (active) router.push('/admin');
          return;
        }

        // Unenroll any dangling unverified factors from previous setup attempts
        const unverifiedFactors = allFactors.filter(f => f.status === 'unverified');
        for (const f of unverifiedFactors) {
          const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId: f.id });
          if (unenrollError) {
            console.error("Failed to unenroll:", unenrollError);
          }
        }

        if (!active) return;

        // Fetch factors again after cleanup to update debug info
        const { data: cleanFactorsData } = await supabase.auth.mfa.listFactors();
        if (cleanFactorsData && active) {
          const cleanAllFactors = (Array.isArray(cleanFactorsData)
            ? cleanFactorsData
            : [
                ...(cleanFactorsData?.all || []),
                ...(cleanFactorsData?.totp || []),
                ...(cleanFactorsData?.phone || [])
              ].filter((f, index, self) => self.findIndex(t => t.id === f.id) === index)) as MFAFactor[];
          setDebugFactors(cleanAllFactors);
        }

        if (!active) return;

        // 2. Perform the fresh enrollment with a unique friendlyName to guarantee no collisions
        const { data, error } = await supabase.auth.mfa.enroll({
          factorType: 'totp',
          issuer: 'Online Speechie',
          friendlyName: `Admin TOTP - ${Date.now()}`
        });

        if (!active) return;

        if (error) {
          setErrorMsg(error.message);
        } else if (data) {
          setFactorId(data.id);
          setSecret(data.totp.secret);

          // Generate a base64 encoded data URL for the SVG to ensure reliable rendering and scanning (especially in dark mode)
          const cleanSvg = data.totp.qr_code.replace(/^data:image\/svg\+xml;utf-?8,/, '');
          try {
            const base64 = btoa(cleanSvg);
            setQrCodeDataUrl(`data:image/svg+xml;base64,${base64}`);
          } catch (e) {
            console.error('Failed to encode QR code SVG to base64', e);
            setQrCodeDataUrl(data.totp.qr_code); // Fallback
          }

          // Update diagnostics debug factors with the newly enrolled factor
          setDebugFactors([{
            id: data.id,
            factor_type: 'totp',
            status: 'unverified'
          }]);
        }
      } catch (err: unknown) {
        if (active) {
          const message = err instanceof Error ? err.message : String(err);
          setErrorMsg(message || 'Failed to initialize two-factor authentication setup.');
        }
      } finally {
        if (active) {
          setEnrollLoading(false);
        }
      }
    }

    startEnrollment();

    return () => {
      active = false;
    };
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
        setSuccessMsg('Two-factor authentication successfully enabled. Redirecting...');
        setTimeout(() => {
          router.push('/admin');
        }, 1500);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setErrorMsg(message || 'Could not verify the authenticator code. Please try again.');
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
            fontSize: '0.9rem',
            textAlign: 'left'
          }}>
            {errorMsg}
          </div>
        )}

        {/* Debug Box */}
        {errorMsg && (
          <div style={{ 
            backgroundColor: '#fef3c7', 
            border: '2px solid #d97706', 
            color: '#78350f', 
            padding: '16px', 
            borderRadius: '12px', 
            marginBottom: '16px', 
            textAlign: 'left',
            fontSize: '0.85rem'
          }}>
            <strong style={{ display: 'block', marginBottom: '8px' }}>Existing Factors (Diagnostics):</strong>
            {debugFactors.length === 0 ? (
              <div>No factors found for this user in Supabase.</div>
            ) : (
              debugFactors.map((f, i) => (
                <div key={f.id} style={{ marginBottom: i < debugFactors.length - 1 ? '6px' : 0 }}>
                  <strong>Factor #{i + 1}:</strong> {f.factor_type} | 
                  <strong>Status:</strong> {f.status} | 
                  <strong>ID:</strong> <code style={{ background: 'rgba(255,255,255,0.4)', padding: '2px 4px', borderRadius: '4px' }}>{f.id.slice(0, 8)}...</code>
                </div>
              ))
            )}
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
              <img 
                src={qrCodeDataUrl} 
                alt="MFA QR Code"
                style={{ 
                  background: '#ffffff', 
                  padding: '16px', 
                  borderRadius: '16px', 
                  border: '2px solid var(--border-color)',
                  display: 'block',
                  width: '220px',
                  height: '220px'
                }}
              />
              
              {secret && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {"Can't scan? Enter manually: "} <code style={{ background: '#E2E2D1', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.9rem', color: '#000' }}>{secret}</code>
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
