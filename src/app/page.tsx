'use client';

import { useState } from 'react';

type Option = {
  id: string;
  text: string;
  weight: number;
};

type Question = {
  id: string;
  text: string;
  internalCode?: string | null;
  videoUrl?: string | null;
  options: Option[];
};

type Placement = {
  isScored: boolean;
  questionType?: string | null;
  question: Question;
};

type SequenceData = {
  id: string;
  title: string;
  placements: Placement[];
};

type AssessmentData = {
  ageMonths: number;
  sequence: SequenceData;
  icsSequence: SequenceData;
};

export default function AssessmentApp() {
  const getSafeEmbedUrl = (url: string) => {
    if (!url) return '';
    try {
      let finalUrl = url;
      // Handle YouTube
      if (url.includes('youtube.com/watch?v=')) {
        const urlObj = new URL(url);
        const v = urlObj.searchParams.get('v');
        finalUrl = v ? `https://www.youtube.com/embed/${v}` : url;
      }
      else if (url.includes('youtu.be/')) {
        const v = url.split('youtu.be/')[1]?.split('?')[0];
        finalUrl = v ? `https://www.youtube.com/embed/${v}` : url;
      }
      // Handle Vimeo
      else if (url.includes('vimeo.com/') && !url.includes('player.vimeo.com')) {
        const v = url.split('vimeo.com/')[1]?.split(/[?#]/)[0];
        if (v && !isNaN(Number(v))) {
          finalUrl = `https://player.vimeo.com/video/${v}`;
        }
      }

      // Add Autoplay params (Warning: browsers may block autoplay if not muted)
      if (finalUrl.includes('youtube.com/embed/') || finalUrl.includes('player.vimeo.com/video/')) {
        const char = finalUrl.includes('?') ? '&' : '?';
        return `${finalUrl}${char}autoplay=1`;
      }
      return finalUrl;
    } catch(e) { return url; }
  };

  const [step, setStep] = useState<'age' | 'quiz' | 'ics' | 'contact' | 'result'>('age');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [childDoB, setChildDoB] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [sequence, setSequence] = useState<SequenceData | null>(null);
  const [icsSequence, setIcsSequence] = useState<SequenceData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [pastAnswers, setPastAnswers] = useState<{questionCode: string | null, weight: number, text: string}[]>([]);

  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  // 1. Submit DoB only to get Sequence
  const handleStartAge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childDoB) {
      setError('Please provide your child\'s date of birth');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/assessment', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        credentials: 'include',
        body: JSON.stringify({ childDoB }),
      });

      const data: AssessmentData & { outOfRange?: boolean; calculated_age_months?: number; error?: string } = await res.json();
      if (!res.ok) {
        if (data.outOfRange) {
          // @ts-ignore
          if (typeof window !== 'undefined' && window.dataLayer) {
            // @ts-ignore
            window.dataLayer.push({
              event: 'out_of_range_submission',
              age: data.calculated_age_months
            });
          }
        }
        throw new Error(data.error || 'Failed to start assessment');
      }

      setSequence(data.sequence);
      setIcsSequence(data.icsSequence);
      setStep('quiz');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Process Quiz Answers
  const allPlacements = sequence ? [...sequence.placements, ...(icsSequence ? icsSequence.placements : [])] : [];

  const handleAnswer = (option: Option, placement: Placement) => {
    const isScored = placement.questionType === 'Scored';
    const isICS = placement.question.internalCode?.startsWith('ICS');
    const effectiveWeight = (isScored || isICS) ? option.weight : 0;

    setPastAnswers([...pastAnswers, { 
      questionCode: placement.question.internalCode || null, 
      weight: effectiveWeight, 
      text: option.text 
    }]);
    
    // Only add to score if the placement specifically marks it as 'Scored'
    if (isScored) {
      setScore(score + option.weight);
    }

    if (currentQuestionIndex < allPlacements.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setStep('contact');
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      const lastAnswer = pastAnswers[pastAnswers.length - 1];
      const prevPlacement = allPlacements[currentQuestionIndex - 1];
      if (prevPlacement.questionType === 'Scored') {
        setScore(score - lastAnswer.weight);
      }
      setPastAnswers(pastAnswers.slice(0, -1));
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // 3. Final Submit with Parent Info
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentName || !parentEmail) {
      setError('Please fill out your contact details');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        credentials: 'include',
        body: JSON.stringify({ 
          parentName, 
          parentEmail, 
          childDoB,
          totalScore: score,
          answers: pastAnswers
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      
      setSubmissionResult(data.submission);
      setSubmissionId(data.submission.id);
      setStep('result');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="site-header">
        <a href="https://onlinespeechie.com/" className="site-header-logo">
          <img src="https://onlinespeechie.com/wp-content/uploads/2024/03/os-logo-new.png" alt="Online Speechie" />
        </a>
        
        <button className="mobile-menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <div className={`site-header-menu ${isMenuOpen ? 'open' : ''}`}>
          <nav className="site-header-nav">
            <a href="https://onlinespeechie.com/language-check-in">Late Talker Quiz</a>
            <a href="https://onlinespeechie.com/programs/">Programs</a>
            <a href="https://onlinespeechie.com/activity">Activity Library</a>
            <a href="https://onlinespeechie.com/clinic/">Clinic</a>
          </nav>
          <div className="site-header-right">
            <a href="https://onlinespeechie.com/cart">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
              $0.00
            </a>
            <a href="https://onlinespeechie.com/login">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              Login
            </a>
          </div>
        </div>
      </header>

      <main style={{ minHeight: '100vh', padding: '40px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      <div className="card-panel animate-fade-in" style={{ width: '100%', maxWidth: step === 'quiz' ? '1200px' : '600px' }}>
        
        {/* Step 1: Getting DoB */}
        {step === 'age' && (
          <div>
            <h1 style={{ marginBottom: '16px', fontSize: '2rem' }}>Language Check-In</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '1.1rem' }}>
              Let's find out exactly where your child is at. To begin, please enter your child's date of birth.
            </p>

            {error && <div style={{ color: '#ef4444', marginBottom: '16px', fontWeight: 600 }}>{error}</div>}

            <form onSubmit={handleStartAge}>
              <div className="input-group">
                <label className="input-label">Child's Date of Birth</label>
                <input 
                  type="date" 
                  className="input-field" 
                  value={childDoB}
                  onChange={e => setChildDoB(e.target.value)}
                  disabled={loading}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <button type="submit" className="btn btn-start" style={{ width: '100%', marginTop: '16px' }} disabled={loading}>
                {loading ? 'Loading Questions...' : 'Start Check-in'}
              </button>
            </form>
          </div>
        )}

        {/* Persistent DoB UI (Visible in Quiz, Final-Tag, Contact) */}
        {step !== 'age' && step !== 'result' && (
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Child's Date of Birth</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 500 }}>{new Date(childDoB).toLocaleDateString()}</div>
            </div>
            <button 
              onClick={() => { setStep('age'); setSequence(null); setIcsSequence(null); setScore(0); setPastAnswers([]); setCurrentQuestionIndex(0); }}
              className="btn btn-secondary"
              style={{ padding: '8px 16px', fontSize: '0.9rem' }}
            >
              Edit
            </button>
          </div>
        )}

        {/* Step 2: Unified Quiz Layout */}
        {step === 'quiz' && allPlacements.length > 0 && (
          <div key={currentQuestionIndex} className="animate-fade-in">
            <div className="progress-bar-bg" style={{ marginBottom: '16px' }}>
              <div 
                className="progress-bar-fill" 
                style={{ width: `${((currentQuestionIndex) / allPlacements.length) * 100}%` }}
              />
            </div>
            
            {currentQuestionIndex > 0 && (
              <button 
                onClick={handleBack}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px', padding: 0 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                Previous Question
              </button>
            )}

            <p style={{ color: 'var(--text-muted)', fontWeight: 700, marginBottom: '16px', fontSize: '1rem' }}>
              Question {currentQuestionIndex + 1} of {allPlacements.length}
            </p>
            
            <div className="question-layout">
              {/* TEXT SECTION FIRST IN HTML (Will sit on top for mobile/medium, left or right depending on row-reverse) */}
              <div className="question-content">
                {allPlacements[currentQuestionIndex].question.internalCode?.startsWith('ICS') && (
                  <p style={{ color: '#f59e0b', fontWeight: 700, marginBottom: '16px', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Speech Clarity
                  </p>
                )}
                <h2 style={{ fontSize: '1.8rem', marginBottom: '32px', lineHeight: 1.4 }}>
                  {allPlacements[currentQuestionIndex].question.text}
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {allPlacements[currentQuestionIndex].question.options.map(option => (
                    <button 
                      key={option.id}
                      className="option-btn"
                      onClick={() => handleAnswer(option, allPlacements[currentQuestionIndex])}
                      disabled={loading}
                    >
                      {option.text}
                    </button>
                  ))}
                </div>
              </div>

              {/* VIDEO SECTION SECOND IN HTML */}
              {allPlacements[currentQuestionIndex].question.videoUrl && allPlacements[currentQuestionIndex].question.videoUrl!.startsWith('http') && (
                <div className="video-container">
                  {allPlacements[currentQuestionIndex].question.videoUrl!.includes('youtube.com') || allPlacements[currentQuestionIndex].question.videoUrl!.includes('youtu.be') || allPlacements[currentQuestionIndex].question.videoUrl!.includes('vimeo.com') ? (
                    <iframe 
                      src={getSafeEmbedUrl(allPlacements[currentQuestionIndex].question.videoUrl!)} 
                      width="100%" 
                      height="100%" 
                      frameBorder="0" 
                      allow="autoplay; fullscreen"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <video 
                      src={allPlacements[currentQuestionIndex].question.videoUrl!} 
                      controls 
                      autoPlay
                      width="100%" 
                      height="100%"
                      style={{ objectFit: 'cover' }}
                    ></video>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Contact Form at the End */}
        {step === 'contact' && (
          <div className="animate-fade-in">
            <h1 style={{ marginBottom: '12px', fontSize: '2rem' }}>Almost Done!</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '1.1rem' }}>
              We've calculated your child's progress profile. Please enter your contact details to view the results.
            </p>

            {error && <div style={{ color: '#ef4444', marginBottom: '16px', fontWeight: 600 }}>{error}</div>}

            <form onSubmit={handleFinalSubmit}>
              <div className="input-group">
                <label className="input-label">Parent / Guardian Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Jane" 
                  value={parentName}
                  onChange={e => setParentName(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Email Address</label>
                <input 
                  type="email" 
                  className="input-field" 
                  placeholder="hello@example.com" 
                  value={parentEmail}
                  onChange={e => setParentEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <button type="submit" className="btn btn-start" style={{ width: '100%', marginTop: '16px' }} disabled={loading}>
                {loading ? 'Submitting...' : 'Receive Results'}
              </button>
            </form>
          </div>
        )}

        {/* Step 4: Final Results */}
        {step === 'result' && (
          <div style={{ textAlign: 'center' }} className="animate-fade-in">
            <div style={{ fontSize: '4rem', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
              🌟
            </div>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Check-In Complete</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.25rem', marginBottom: '24px' }}>
              Thank you for completing the Language Check-In!<br /><br />
              Your results will be sent to the provided email address.
            </p>

            {submissionId && (
              <a 
                href={`/api/pdf/${submissionId}`} 
                target="_blank" 
                className="btn btn-start" 
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', marginBottom: '16px', width: '100%', justifyContent: 'center' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Download PDF Report
              </a>
            )}

            <button onClick={() => window.location.reload()} className="btn btn-outline-start" style={{ width: '100%' }}>
              Start New Check-In
            </button>
          </div>
        )}

      </div>
      <div style={{ marginTop: 'auto', paddingTop: '40px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
        <a href="/admin" style={{ color: 'inherit', textDecoration: 'none' }}>Admin Panel</a>
      </div>
    </main>
    </>
  );
}
