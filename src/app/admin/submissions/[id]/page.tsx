import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

function calculateAgeAtSubmission(dob: Date, createdAt: Date) {
  let years = createdAt.getFullYear() - dob.getFullYear();
  let months = createdAt.getMonth() - dob.getMonth();
  let days = createdAt.getDate() - dob.getDate();

  if (days < 0) {
    const prevMonth = new Date(createdAt.getFullYear(), createdAt.getMonth(), 0);
    days += prevMonth.getDate();
    months--;
  }

  if (months < 0) {
    months += 12;
    years--;
  }

  const parts = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? 'yr' : 'yrs'}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? 'mo' : 'mos'}`);
  if (days > 0 || parts.length === 0) parts.push(`${days} ${days === 1 ? 'd' : 'd'}`);

  return parts.join(', ');
}

export default async function SubmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const submission = await prisma.submission.findUnique({
    where: { id },
    include: { answers: true },
  });

  if (!submission) {
    notFound();
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1100px', margin: '0 auto', fontFamily: "'Quicksand', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.5rem' }}>Submission Details</h1>
        <Link href="/admin/submissions" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
          &larr; Back to List
        </Link>
      </div>

      {/* Metadata Table in a Single Card */}
      <div className="card-panel" style={{ padding: '24px', marginBottom: '32px', width: '100%', margin: '0 0 32px 0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '14px 8px', fontWeight: 600, color: 'var(--text-muted)', width: '280px' }}>Submission Date</td>
              <td style={{ padding: '14px 8px', fontSize: '1.05rem', fontWeight: 500 }}>
                {submission.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '14px 8px', fontWeight: 600, color: 'var(--text-muted)' }}>Parent Name</td>
              <td style={{ padding: '14px 8px', fontSize: '1.05rem', fontWeight: 500 }}>{submission.parentName}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '14px 8px', fontWeight: 600, color: 'var(--text-muted)' }}>Email</td>
              <td style={{ padding: '14px 8px', fontSize: '1.05rem', fontWeight: 500, wordBreak: 'break-all' }}>{submission.parentEmail}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '14px 8px', fontWeight: 600, color: 'var(--text-muted)' }}>Age at Submission</td>
              <td style={{ padding: '14px 8px', fontSize: '1.05rem', fontWeight: 500 }}>
                {calculateAgeAtSubmission(submission.childDob, submission.createdAt)}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '14px 8px', fontWeight: 600, color: 'var(--text-muted)' }}>Child's DOB</td>
              <td style={{ padding: '14px 8px', fontSize: '1.05rem', fontWeight: 500 }}>
                {submission.childDob.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Results Boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px', width: '100%' }}>
        <div className="card-panel" style={{ padding: '24px', textAlign: 'center', width: '100%', margin: 0 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Score</p>
          <h2 style={{ fontSize: '2rem', marginTop: '8px' }}>{submission.totalScore}</h2>
        </div>
        <div className="card-panel" style={{ padding: '24px', textAlign: 'center', width: '100%', margin: 0 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase' }}>Score Status</p>
          <h2 style={{ fontSize: '1.5rem', marginTop: '8px', color: submission.scoreStatus === 'On Track' ? '#10b981' : '#f59e0b' }}>
            {submission.scoreStatus}
          </h2>
        </div>
        <div className="card-panel" style={{ padding: '24px', textAlign: 'center', width: '100%', margin: 0 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase' }}>Comm Stage</p>
          <h2 style={{ fontSize: '1.2rem', marginTop: '8px' }}>{submission.communicationStage}</h2>
        </div>
        <div className="card-panel" style={{ padding: '24px', textAlign: 'center', width: '100%', margin: 0 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase' }}>Speech Clarity</p>
          <h2 style={{ fontSize: '1.2rem', marginTop: '8px', color: submission.speechClarity?.includes('CONCERN') ? '#ef4444' : '#10b981' }}>
            {submission.speechClarity || 'N/A'}
          </h2>
        </div>
      </div>

      <h2 style={{ fontSize: '1.8rem', marginBottom: '24px' }}>Answers</h2>
      <div className="card-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {submission.answers.map((answer, index) => (
          <div key={answer.id} style={{ 
            padding: '20px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderBottom: index < submission.answers.length - 1 ? '1px solid #e2e8f0' : 'none'
          }}>
            <div style={{ flex: '1', paddingRight: '24px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '1.1rem', minWidth: '24px', paddingTop: '1px' }}>
                {index + 1}.
              </span>
              <p style={{ fontSize: '1.1rem', fontWeight: 500, margin: 0 }}>
                {answer.questionText}
              </p>
            </div>
            <div style={{ flexShrink: 0, width: '180px' }}>
              <div style={{ 
                background: '#f8fafc', 
                border: '1px solid #e2e8f0', 
                padding: '8px 12px', 
                borderRadius: '8px', 
                fontSize: '1rem', 
                fontWeight: 700,
                textAlign: 'center',
                width: '100%',
                boxSizing: 'border-box'
              }}>
                {answer.value}
              </div>
            </div>
          </div>
        ))}
        {submission.answers.length === 0 && (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No answers recorded for this submission.
          </div>
        )}
      </div>
    </div>
  );
}
