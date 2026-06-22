'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        router.push('/admin');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-main)', padding: '20px' }}>
      <div className="card-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <img src="https://onlinespeechie.com/wp-content/uploads/2024/03/os-logo-new.png" alt="Logo" style={{ height: '40px', marginBottom: '24px', marginLeft: 'auto', marginRight: 'auto' }} />
        <h2 style={{ marginBottom: '24px', fontSize: '1.8rem' }}>Admin Login</h2>
        
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

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Email Address</label>
            <input 
              type="email" 
              placeholder="admin@onlinespeechie.com" 
              className="input-field" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required
            />
          </div>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="input-field" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div style={{ marginTop: '24px' }}>
          <a href="/" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textDecoration: 'none' }}>&larr; Back to Assessment</a>
        </div>
      </div>
    </div>
  );
}
