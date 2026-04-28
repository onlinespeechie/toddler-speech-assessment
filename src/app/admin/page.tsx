'use client';

import { useState, useEffect } from 'react';

type Option = {
  id?: string;
  text: string;
  weight: number;
  tagValue?: string | null;
};

type Question = {
  id: string;
  text: string;
  videoUrl?: string | null;
  internalCode?: string | null;
  category?: string | null;
  isTagQuestion?: boolean;
  options: Option[];
  placements?: any[];
};

type Placement = {
  id: string;
  order: number;
  question: Question;
};

type Sequence = {
  id: string;
  title: string;
  minMonths: number;
  maxMonths: number;
  placements: Placement[];
};

export default function AdminPanel() {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [bankQuestions, setBankQuestions] = useState<Question[]>([]);
  
  // -1 means the "Global Question Bank", >= 0 indicates a sequence index
  const [activeTab, setActiveTab] = useState<-1 | number>(-1);
  const [loading, setLoading] = useState(true);

  // New Question Form State (Bank)
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newInternalCode, setNewInternalCode] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newOptions, setNewOptions] = useState<Option[]>([
    { text: 'Yes', weight: 10 },
    { text: 'Sometimes', weight: 5 },
    { text: 'No', weight: 0 }
  ]);

  // Assign to sequence Dropdown
  const [selectedBankQuestionId, setSelectedBankQuestionId] = useState<string>('');

  // Editing state (Bank)
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{text: string; videoUrl: string; internalCode: string; category: string; options: Option[]; isTagQuestion: boolean}>({ text: '', videoUrl: '', internalCode: '', category: '', options: [], isTagQuestion: false });

  const fetchData = async () => {
    setLoading(true);
    try {
      const hdrs = { 'ngrok-skip-browser-warning': 'true' };
      const t = Date.now();
      const [seqRes, bankRes] = await Promise.all([
        fetch(`/api/admin/sequences?t=${t}`, { headers: hdrs, credentials: 'include', cache: 'no-store' }),
        fetch(`/api/admin/bank?t=${t}`, { headers: hdrs, credentials: 'include', cache: 'no-store' })
      ]);
      
      // Safety check if Ngrok intercepted with HTML instead of JSON
      if (!seqRes.ok || seqRes.headers.get("content-type")?.includes("text/html")) {
        throw new Error("API Route intercepted by Ngrok warning.");
      }
      
      const seqData = await seqRes.json();
      const bankData = await bankRes.json();
      
      setSequences(seqData);
      setBankQuestions(bankData);
      if (bankData?.length > 0) setSelectedBankQuestionId(bankData[0].id);
    } catch (e) {
      console.error("Fetch Data failed (often due to Ngrok intercepts):", e);
      alert("Failed to load data. If you are on Ngrok, ensure the warning block is bypassed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // -- BANK BUILDER HANDLERS --
  const handleAddNewOption = () => setNewOptions([...newOptions, { text: '', weight: 0 }]);
  const handleRemoveNewOption = (index: number) => setNewOptions(newOptions.filter((_, i) => i !== index));
  const handleNewOptionChange = (index: number, field: keyof Option, value: string | number) => {
    const updated = [...newOptions];
    updated[index] = { ...updated[index], [field]: value };
    setNewOptions(updated);
  };

  const handleCreateBankQuestion = async () => {
    if (!newQuestionText) return alert("Question text required.");
    if (newOptions.length === 0) return alert("At least one option required.");
    
    await fetch('/api/admin/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
      credentials: 'include',
      body: JSON.stringify({ text: newQuestionText, videoUrl: newVideoUrl, internalCode: newInternalCode || null, category: newCategory || null, options: newOptions })
    });
    
    setNewQuestionText('');
    setNewVideoUrl('');
    setNewInternalCode('');
    setNewCategory('');
    setNewOptions([{ text: 'Yes', weight: 10 }, { text: 'Sometimes', weight: 5 }, { text: 'No', weight: 0 }]);
    fetchData(); 
  };

  // -- BANK EDIT HANDLERS --
  const handleStartEdit = (q: Question) => {
    setEditingQuestionId(q.id);
    setEditForm({
      text: q.text,
      videoUrl: q.videoUrl || '',
      internalCode: q.internalCode || '',
      category: q.category || '',
      isTagQuestion: q.isTagQuestion || false,
      options: q.options.map(o => ({ id: o.id, text: o.text, weight: o.weight, tagValue: o.tagValue }))
    });
  };

  const handleEditOptionAdd = () => setEditForm({ ...editForm, options: [...editForm.options, { text: '', weight: 0 }] });
  const handleEditOptionChange = (idx: number, field: keyof Option, value: string | number) => {
    const newOpts = [...editForm.options];
    newOpts[idx] = { ...newOpts[idx], [field]: value };
    setEditForm({ ...editForm, options: newOpts });
  };
  const handleEditOptionRemove = (idx: number) => setEditForm({ ...editForm, options: editForm.options.filter((_, i) => i !== idx) });

  const handleSaveEdit = async () => {
    if (!editingQuestionId) return;
    await fetch(`/api/admin/questions/${editingQuestionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
      credentials: 'include',
      body: JSON.stringify({ text: editForm.text, videoUrl: editForm.videoUrl, internalCode: editForm.internalCode || null, category: editForm.category || null, options: editForm.options })
    });
    setEditingQuestionId(null);
    fetchData();
  };

  const handleDeleteBankQuestion = async (id: string) => {
    if (!confirm('Warning: This will delete the universal question from ALL sequences. Are you sure?')) return;
    await fetch(`/api/admin/questions/${id}`, { method: 'DELETE', headers: { 'ngrok-skip-browser-warning': 'true' }, credentials: 'include' });
    fetchData();
  };

  // -- SEQUENCE TAB HANDLERS --
  const handleAssignToSequence = async (sequenceId: string) => {
    if (!selectedBankQuestionId) return;
    const res = await fetch('/api/admin/placements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
      credentials: 'include',
      body: JSON.stringify({ sequenceId, questionId: selectedBankQuestionId })
    });
    
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Failed to assign question.");
    }
    
    fetchData();
  };

  const handleRemovePlacement = async (placementId: string) => {
    if (!confirm('Remove this question from the sequence? (It will remain in the global bank)')) return;
    await fetch(`/api/admin/placements/${placementId}`, { method: 'DELETE', headers: { 'ngrok-skip-browser-warning': 'true' }, credentials: 'include' });
    fetchData();
  };

  const handleReorderPlacement = async (placementId: string, direction: 'up' | 'down') => {
    if (activeTab < 0) return;
    const seq = sequences[activeTab];
    const ps = [...seq.placements];
    const currentIndex = ps.findIndex(p => p.id === placementId);
    
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === ps.length - 1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const temp = ps[currentIndex];
    ps[currentIndex] = ps[targetIndex];
    ps[targetIndex] = temp;

    const newSequences = [...sequences];
    newSequences[activeTab].placements = ps;
    setSequences(newSequences);
    
    const orderedIds = ps.map(p => p.id);
    await fetch(`/api/admin/placements/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
      credentials: 'include',
      body: JSON.stringify({ orderedIds })
    });
  };

  if (loading) return <div style={{ padding: '40px' }}>Loading admin matrix...</div>;

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto', fontFamily: "'Quicksand', sans-serif" }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Admin Dashboard</h1>
      <p style={{ marginBottom: '32px', color: 'var(--text-muted)' }}>Universal Question Bank & Sequence Mapping.</p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', marginBottom: '32px', paddingBottom: '8px' }}>
        <button 
          onClick={() => setActiveTab(-1)}
          className={`btn ${activeTab === -1 ? 'btn-primary' : ''}`}
          style={{ 
            background: activeTab === -1 ? 'var(--primary)' : 'white',
            boxShadow: activeTab === -1 ? '4px 4px 0 #000' : 'none',
            border: activeTab === -1 ? '2px solid #000' : '2px solid var(--border-color)',
            flexShrink: 0
          }}
        >
          GLOBAL QUESTION BANK
        </button>
        <span style={{ borderLeft: '2px solid #ccc', margin: '0 8px' }}></span>
        {sequences.map((s, index) => (
          <button 
            key={s.id} 
            onClick={() => setActiveTab(index)}
            className={`btn`}
            style={{ 
              background: activeTab === index ? '#fefefe' : 'white',
              boxShadow: activeTab === index ? '4px 4px 0 #A09D7D' : 'none',
              border: activeTab === index ? '2px solid #A09D7D' : '2px solid var(--border-color)',
              flexShrink: 0
            }}
          >
            {s.title}
          </button>
        ))}
      </div>

      {/* --- GLOBAL BANK UI --- */}
      {activeTab === -1 && (
        <div className="card-panel">
          <h2 style={{ marginBottom: '8px' }}>Global Question Bank</h2>
          <p style={{ marginBottom: '24px', color: 'var(--text-muted)' }}>Create questions here. You can assign them to sequences in the sequence tabs.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {bankQuestions.filter(q => !q.isTagQuestion).map((q) => (
              <div key={q.id} style={{ border: '2px solid var(--border-color)', padding: '24px', borderRadius: '16px', background: '#fafaf5' }}>
                {editingQuestionId !== q.id && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{q.internalCode ? `[${q.internalCode}] ` : ''}{q.text}</h3>
                      {q.internalCode && <div style={{ marginBottom: '8px', fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>Code: {q.internalCode} {q.category ? `| Category: ${q.category}` : ''}</div>}
                      {q.videoUrl && <div style={{ marginBottom: '8px', fontSize: '0.85rem', color: 'var(--primary)' }}>🎥 Video: {q.videoUrl}</div>}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                        {q.options.map(o => (
                          <span key={o.id} style={{ background: '#E2E2D1', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600 }}>
                            {o.text} ({o.weight}pts)
                          </span>
                        ))}
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>Used in {q.placements?.length || 0} sequences</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                      <button onClick={() => handleStartEdit(q)} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>Edit</button>
                      <button onClick={() => handleDeleteBankQuestion(q.id)} style={{ background: 'transparent', color: '#cc0000', border: '2px solid #cc0000', padding: '8px 16px', borderRadius: '99px', cursor: 'pointer', fontWeight: 'bold' }}>Delete</button>
                    </div>
                  </div>
                )}
                {/* Edit Form */}
                {editingQuestionId === q.id && (
                  <div>
                    <h3 style={{ marginBottom: '16px' }}>Edit Global Question</h3>
                    <input type="text" className="input-field" value={editForm.text} onChange={e => setEditForm({...editForm, text: e.target.value})} style={{ marginBottom: '16px' }} />
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Internal Code</label>
                        <input type="text" className="input-field" placeholder="Internal Code (e.g. Q38, ICS_1)" value={editForm.internalCode} onChange={e => setEditForm({...editForm, internalCode: e.target.value})} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Category</label>
                        <input type="text" className="input-field" placeholder="Category (e.g. Expressive)" value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} />
                      </div>
                    </div>
                    <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Video URL (Optional)</label>
                    <input type="text" className="input-field" placeholder="Optional Video URL (e.g. YouTube iframe src, or .mp4 link)" value={editForm.videoUrl} onChange={e => setEditForm({...editForm, videoUrl: e.target.value})} style={{ marginBottom: '16px' }} />
                    <h4 style={{ marginBottom: '8px', fontSize: '1rem' }}>Options</h4>
                    {editForm.options.map((opt, oIndex) => (
                      <div key={oIndex} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <input className="input-field" style={{ flex: 2, padding: '8px' }} value={opt.text} onChange={e => handleEditOptionChange(oIndex, 'text', e.target.value)} placeholder="Option text" />
                        
                        {editForm.isTagQuestion ? (
                          <input className="input-field" type="text" style={{ flex: 1, padding: '8px' }} value={opt.tagValue || ''} onChange={e => handleEditOptionChange(oIndex, 'tagValue', e.target.value)} placeholder="Tag Value" />
                        ) : (
                          <input className="input-field" type="number" style={{ flex: 1, padding: '8px' }} value={opt.weight} onChange={e => handleEditOptionChange(oIndex, 'weight', parseInt(e.target.value))} placeholder="Points" />
                        )}

                        <button onClick={() => handleEditOptionRemove(oIndex)} style={{ background:'transparent', color:'red', border:'none', cursor:'pointer', fontWeight:'bold' }}>✕</button>
                      </div>
                    ))}
                    <button onClick={handleEditOptionAdd} style={{ background:'transparent', border:'2px dashed var(--border-color)', padding:'8px 16px', borderRadius:'8px', cursor:'pointer', marginBottom:'16px', width:'100%' }}>+ Add Option</button>
                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', borderTop: '2px solid var(--border-color)', paddingTop: '16px' }}>
                      <button onClick={() => setEditingQuestionId(null)} style={{ background:'transparent', border:'none', cursor:'pointer' }}>Cancel</button>
                      <button onClick={handleSaveEdit} className="btn btn-primary" style={{ padding: '8px 24px' }}>Save Changes</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Tag Questions Section (Rendered At Bottom of Bank) */}
          {bankQuestions.filter(q => q.isTagQuestion).length > 0 && (
            <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '4px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Master Tag Settings</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
                This unique question runs globally at the end of the assessment to test tags safely decoupled from your point brackets!
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {bankQuestions.filter(q => q.isTagQuestion).map(q => (
                  <div key={q.id} style={{ background: '#fafaf5', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px' }}>
                    
                    {/* Display State */}
                    {editingQuestionId !== q.id && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <span style={{ display: 'inline-block', fontSize: '0.8rem', background: 'var(--primary)', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', marginBottom: '8px' }}>FINAL TAG QUESTION</span>
                          <strong style={{ fontSize: '1.25rem', display: 'block', marginBottom: '12px' }}>{q.text}</strong>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {q.options.map(opt => (
                              <span key={opt.id} style={{ padding: '8px 16px', background: 'white', border: '2px solid var(--border-color)', borderRadius: '8px', fontSize: '0.9rem' }}>
                                <b>{opt.text}</b> (Tag: {opt.tagValue || 'None'})
                              </span>
                            ))}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                          <button className="btn btn-primary" onClick={() => handleStartEdit(q)} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>Edit Tags</button>
                        </div>
                      </div>
                    )}

                    {/* Edit Form */}
                    {editingQuestionId === q.id && (
                      <div style={{ marginTop: '8px' }}>
                        <h3 style={{ marginBottom: '16px' }}>Edit Tag Question</h3>
                        <input type="text" className="input-field" value={editForm.text} onChange={e => setEditForm({...editForm, text: e.target.value})} style={{ marginBottom: '16px' }} />
                        
                        <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Video URL (Optional)</label>
                        <input type="text" className="input-field" placeholder="Optional Video URL (e.g. YouTube iframe src, or .mp4 link)" value={editForm.videoUrl} onChange={e => setEditForm({...editForm, videoUrl: e.target.value})} style={{ marginBottom: '16px' }} />

                        <h4 style={{ marginBottom: '8px', fontSize: '1rem' }}>Options & Tags</h4>
                        
                        {editForm.options.map((opt, oIndex) => (
                          <div key={oIndex} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                            <input className="input-field" style={{ flex: 2, padding: '8px' }} value={opt.text} onChange={e => handleEditOptionChange(oIndex, 'text', e.target.value)} placeholder="Option text" />
                            <input className="input-field" type="text" style={{ flex: 1, padding: '8px' }} value={opt.tagValue || ''} onChange={e => handleEditOptionChange(oIndex, 'tagValue', e.target.value)} placeholder="Tag Value Output" />
                            <button onClick={() => handleEditOptionRemove(oIndex)} style={{ background:'transparent', color:'red', border:'none', cursor:'pointer', fontWeight:'bold' }}>✕</button>
                          </div>
                        ))}
                        
                        <button onClick={handleEditOptionAdd} style={{ background:'transparent', border:'2px dashed var(--border-color)', padding:'8px 16px', borderRadius:'8px', cursor:'pointer', marginBottom:'16px', width:'100%' }}>+ Add Tag Option</button>
                        
                        <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', borderTop: '2px solid var(--border-color)', paddingTop: '16px' }}>
                          <button onClick={() => setEditingQuestionId(null)} style={{ background:'transparent', border:'none', cursor:'pointer' }}>Cancel</button>
                          <button onClick={handleSaveEdit} className="btn btn-primary" style={{ padding: '8px 24px' }}>Save Changes</button>
                        </div>
                      </div>
                    )}
                    
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Question Builder */}
          <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '4px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Add Universal Question</h3>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Question Text</label>
            <input type="text" className="input-field" placeholder="e.g. Can your child point to things?" value={newQuestionText} onChange={e => setNewQuestionText(e.target.value)} style={{ marginBottom: '16px' }} />
            
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Internal Code</label>
                <input type="text" className="input-field" placeholder="e.g. Q38, ICS_1, BRIDGE_1" value={newInternalCode} onChange={e => setNewInternalCode(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Category</label>
                <input type="text" className="input-field" placeholder="e.g. Expressive, Comprehension" value={newCategory} onChange={e => setNewCategory(e.target.value)} />
              </div>
            </div>

            <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Video URL (Optional)</label>
            <input type="url" className="input-field" placeholder="e.g. YouTube URL or direct link..." value={newVideoUrl} onChange={e => setNewVideoUrl(e.target.value)} style={{ marginBottom: '24px' }} />
            
            <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Answer Options</label>
            {newOptions.map((opt, nIndex) => (
              <div key={nIndex} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <input className="input-field" style={{ flex: 2, padding: '12px' }} value={opt.text} onChange={e => handleNewOptionChange(nIndex, 'text', e.target.value)} placeholder="Option text" />
                <input className="input-field" type="number" style={{ flex: 1, padding: '12px' }} value={opt.weight} onChange={e => handleNewOptionChange(nIndex, 'weight', parseInt(e.target.value))} placeholder="Points" />
                <button onClick={() => handleRemoveNewOption(nIndex)} style={{ background:'transparent', color:'red', border:'none', cursor:'pointer', fontWeight:'bold', padding: '0 16px' }}>✕</button>
              </div>
            ))}
            <button onClick={handleAddNewOption} style={{ background:'transparent', border:'2px dashed var(--border-color)', padding:'12px 16px', borderRadius:'8px', cursor:'pointer', marginBottom:'24px', width:'100%', fontWeight: 600 }}>+ Add Another Option</button>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleCreateBankQuestion}>Create Question in Bank</button>
          </div>
        </div>
      )}

      {/* --- SEQUENCE BUILDER UI --- */}
      {activeTab >= 0 && sequences.length > 0 && (
        <div className="card-panel">
          <h2 style={{ marginBottom: '8px' }}>{sequences[activeTab].title} Sequence</h2>
          <p style={{ marginBottom: '24px', color: 'var(--text-muted)' }}>Questions assigned to this age group.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {sequences[activeTab].placements.map((p, pIndex) => (
              <div key={p.id} style={{ border: '2px solid var(--border-color)', padding: '24px', borderRadius: '16px', background: '#fafaf5' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button onClick={() => handleReorderPlacement(p.id, 'up')} disabled={pIndex === 0} style={{ cursor: pIndex === 0 ? 'not-allowed' : 'pointer', background: 'none', border: 'none', fontSize: '1.2rem' }}>▲</button>
                      <button onClick={() => handleReorderPlacement(p.id, 'down')} disabled={pIndex === sequences[activeTab].placements.length - 1} style={{ cursor: pIndex === sequences[activeTab].placements.length - 1 ? 'not-allowed' : 'pointer', background: 'none', border: 'none', fontSize: '1.2rem' }}>▼</button>
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{p.question.internalCode ? `[${p.question.internalCode}] ` : ''}{p.question.text}</h3>
                      {p.question.videoUrl && <div style={{ marginBottom: '4px', fontSize: '0.85rem', color: 'var(--primary)' }}>🎥 Video: {p.question.videoUrl}</div>}
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{p.question.options.length} options mapped.</p>
                    </div>
                  </div>
                  <button onClick={() => handleRemovePlacement(p.id)} style={{ background: '#ffcccc', color: '#cc0000', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Unlink</button>
                </div>
              </div>
            ))}
            {sequences[activeTab].placements.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No questions assigned to this sequence yet.</div>
            )}
          </div>

          <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '2px solid var(--border-color)' }}>
            <h3>Assign Question to Sequence</h3>
            <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
              <select className="input-field" value={selectedBankQuestionId} onChange={e => setSelectedBankQuestionId(e.target.value)}>
                {bankQuestions.map(q => (
                  <option key={q.id} value={q.id}>{q.internalCode ? `[${q.internalCode}] ` : ''}{q.text}</option>
                ))}
              </select>
              <button className="btn btn-primary" onClick={() => handleAssignToSequence(sequences[activeTab].id)}>Assign</button>
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
}
