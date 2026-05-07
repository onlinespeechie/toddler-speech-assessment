import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function SubmissionDetailPage({ params }: { params: { id: string } }) {
  const submission = await prisma.submission.findUnique({
    where: { id: params.id },
    include: { answers: true },
  });

  if (!submission) {
    notFound();
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto', fontFamily: "'Quicksand', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.5rem' }}>Submission Details</h1>
        <Link href="/admin/submissions" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
          &larr; Back to List
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div className="card-panel" style={{ padding: '24px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Score</p>
          <h2 style={{ fontSize: '2rem', marginTop: '8px' }}>{submission.totalScore}</h2>
        </div>
        <div className="card-panel" style={{ padding: '24px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase' }}>Score Status</p>
          <h2 style={{ fontSize: '1.5rem', marginTop: '8px', color: submission.scoreStatus === 'On Track' ? '#10b981' : '#f59e0b' }}>
            {submission.scoreStatus}
          </h2>
        </div>
        <div className="card-panel" style={{ padding: '24px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase' }}>Comm Stage</p>
          <h2 style={{ fontSize: '1.2rem', marginTop: '8px' }}>{submission.communicationStage}</h2>
        </div>
        <div className="card-panel" style={{ padding: '24px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase' }}>Speech Clarity</p>
          <h2 style={{ fontSize: '1.2rem', marginTop: '8px', color: submission.speechClarity?.includes('CONCERN') ? '#ef4444' : '#10b981' }}>
            {submission.speechClarity || 'N/A'}
          </h2>
        </div>
      </div>

      <h2 style={{ fontSize: '1.8rem', marginBottom: '24px' }}>Answers</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {submission.answers.map((answer) => (
          <div key={answer.id} className="card-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: '1', paddingRight: '24px' }}>
              <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>
                {answer.questionText}
              </p>
            </div>
            <div style={{ flexShrink: 0, textAlign: 'right' }}>
              <span style={{ 
                background: '#f8fafc', 
                border: '1px solid #e2e8f0', 
                padding: '8px 16px', 
                borderRadius: '8px', 
                fontSize: '1rem', 
                fontWeight: 700 
              }}>
                {answer.value}
              </span>
            </div>
          </div>
        ))}
        {submission.answers.length === 0 && (
          <div className="card-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No answers recorded for this submission.
          </div>
        )}
      </div>
    </div>
  );
}
