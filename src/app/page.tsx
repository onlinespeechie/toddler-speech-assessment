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
  
  const [childDoB, setChildDoB] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [sequence, setSequence] = useState<SequenceData | null>(null);
  const [icsSequence, setIcsSequence] = useState<SequenceData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [icsIndex, setIcsIndex] = useState(0);
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
  const handleAnswer = (option: Option, question: Question) => {
    setPastAnswers([...pastAnswers, { questionCode: question.internalCode || null, weight: option.weight, text: option.text }]);
    const newScore = score + option.weight;
    setScore(newScore);

    if (sequence && currentQuestionIndex < sequence.placements.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Finished main quiz, move to ICS
      setStep('ics');
    }
  };

  const handleIcsAnswer = (option: Option, question: Question) => {
    setPastAnswers([...pastAnswers, { questionCode: question.internalCode || null, weight: option.weight, text: option.text }]);
    
    if (icsSequence && icsIndex < icsSequence.placements.length - 1) {
      setIcsIndex(icsIndex + 1);
    } else {
      setStep('contact');
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      const lastAnswer = pastAnswers[pastAnswers.length - 1];
      setScore(score - lastAnswer.weight);
      setPastAnswers(pastAnswers.slice(0, -1));
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleIcsBack = () => {
    if (icsIndex > 0) {
      const lastAnswer = pastAnswers[pastAnswers.length - 1];
      setPastAnswers(pastAnswers.slice(0, -1));
      setIcsIndex(icsIndex - 1);
    } else {
      // Go back to main quiz
      const lastAnswer = pastAnswers[pastAnswers.length - 1];
      setScore(score - lastAnswer.weight);
      setPastAnswers(pastAnswers.slice(0, -1));
      setCurrentQuestionIndex(sequence ? sequence.placements.length - 1 : 0);
      setStep('quiz');
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
    <main style={{ minHeight: '100vh', padding: '40px 10px', display: 'flex', flexDirection: 'column' }}>
      <div className="header-logo animate-fade-in">
        Online Speechie
      </div>
      
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

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }} disabled={loading}>
                {loading ? 'Loading Questions...' : 'Start Check-In'}
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
              onClick={() => { setStep('age'); setSequence(null); setIcsSequence(null); setScore(0); setPastAnswers([]); setCurrentQuestionIndex(0); setIcsIndex(0); }}
              className="btn btn-secondary"
              style={{ padding: '8px 16px', fontSize: '0.9rem' }}
            >
              Edit
            </button>
          </div>
        )}

        {/* Step 2: Quiz with Video Layout */}
        {step === 'quiz' && sequence && (
          <div key={currentQuestionIndex} className="animate-fade-in">
            <div className="progress-bar-bg" style={{ marginBottom: '16px' }}>
              <div 
                className="progress-bar-fill" 
                style={{ width: `${((currentQuestionIndex) / sequence.placements.length) * 100}%` }}
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
              Question {currentQuestionIndex + 1} of {sequence.placements.length}
            </p>
            
            <div className="question-layout">
              {/* VIDEO SECTION FIRST IN HTML (Will sit on top for mobile/medium, right for desktop due to row-reverse) */}
              {sequence.placements[currentQuestionIndex].question.videoUrl ? (
                <div className="video-container">
                  {sequence.placements[currentQuestionIndex].question.videoUrl.includes('youtube.com') || sequence.placements[currentQuestionIndex].question.videoUrl.includes('youtu.be') || sequence.placements[currentQuestionIndex].question.videoUrl.includes('vimeo.com') ? (
                    <iframe 
                      src={getSafeEmbedUrl(sequence.placements[currentQuestionIndex].question.videoUrl)} 
                      width="100%" 
                      height="100%" 
                      frameBorder="0" 
                      allow="autoplay; fullscreen"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <video 
                      src={sequence.placements[currentQuestionIndex].question.videoUrl} 
                      controls 
                      autoPlay
                      width="100%" 
                      height="100%"
                      style={{ objectFit: 'cover' }}
                    ></video>
                  )}
                </div>
              ) : (
                <div className="video-placeholder video-container">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}>
                      <polygon points="23 7 16 12 23 17 23 7"></polygon>
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                    </svg>
                    <span style={{ fontWeight: 600, fontSize: '1.2rem', color: '#64748b' }}>
                      Vimeo Placeholder ({sequence.placements[currentQuestionIndex].question.internalCode ? `Video ${sequence.placements[currentQuestionIndex].question.internalCode}` : `Video ${currentQuestionIndex + 1}`})
                    </span>
                  </div>
                </div>
              )}
            
              {/* TEXT SECTION SECOND IN HTML */}
              <div className="question-content">
                <h2 style={{ fontSize: '1.8rem', marginBottom: '32px', lineHeight: 1.4 }}>
                  {sequence.placements[currentQuestionIndex].question.text}
                </h2>

                <div>
                  {sequence.placements[currentQuestionIndex].question.options.map(option => (
                    <button 
                      key={option.id}
                      className="option-btn"
                      onClick={() => handleAnswer(option, sequence.placements[currentQuestionIndex].question)}
                      disabled={loading}
                    >
                      {option.text}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2b: ICS Questions */}
        {step === 'ics' && icsSequence && (
          <div key={icsIndex} className="animate-fade-in card-panel">
            <div className="progress-bar-bg" style={{ marginBottom: '16px' }}>
              <div 
                className="progress-bar-fill" 
                style={{ width: `${((icsIndex) / icsSequence.placements.length) * 100}%`, background: '#f59e0b' }}
              />
            </div>

            <button 
              onClick={handleIcsBack}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '16px', padding: 0 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
              Previous Question
            </button>

            <p style={{ color: '#f59e0b', fontWeight: 700, marginBottom: '16px', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Speech Clarity ({icsIndex + 1} of {icsSequence.placements.length})
            </p>

            <h2 style={{ fontSize: '1.8rem', marginBottom: '32px', textAlign: 'center' }}>
              {icsSequence.placements[icsIndex].question.text}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {icsSequence.placements[icsIndex].question.options.map((opt: any) => (
                <button 
                  key={opt.id}
                  className="option-btn"
                  onClick={() => handleIcsAnswer(opt, icsSequence.placements[icsIndex].question)}
                >
                  {opt.text}
                </button>
              ))}
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

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }} disabled={loading}>
                {loading ? 'Submitting...' : 'See Results'}
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
              Thank you for completing the Language Check-In!
            </p>
            
            <div style={{ background: '#fafaf5', border: '2px solid var(--border-color)', borderRadius: '16px', padding: '24px', marginBottom: '32px' }}>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <div style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', flex: '1', minWidth: '200px' }}>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase' }}>Assessment Band</p>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
                    {submissionResult?.finalTag || "Completed"}
                  </div>
                </div>
                
                {submissionResult?.tags?.includes('SPEECH_CLARITY_CONCERN') && (
                  <div style={{ background: '#fef2f2', padding: '16px', borderRadius: '8px', border: '1px solid #fca5a5', flex: '1', minWidth: '200px' }}>
                    <p style={{ color: '#b91c1c', marginBottom: '4px', fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase' }}>Alert Flag</p>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#991b1b' }}>
                      Speech Clarity Concern
                    </div>
                  </div>
                )}
              </div>
            </div>

            {submissionId && (
              <a 
                href={`/api/pdf/${submissionId}`} 
                target="_blank" 
                className="btn btn-primary" 
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', marginBottom: '16px', width: '100%', justifyContent: 'center' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Download PDF Report
              </a>
            )}

            <button onClick={() => window.location.reload()} className="btn btn-secondary" style={{ width: '100%', background: '#F5F5F5', color: '#333' }}>
              Start New Check-In
            </button>
          </div>
        )}

      </div>
      <div style={{ marginTop: 'auto', paddingTop: '40px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
        <a href="/admin" style={{ color: 'inherit', textDecoration: 'none' }}>Admin Panel</a>
      </div>
    </main>
  );
}
