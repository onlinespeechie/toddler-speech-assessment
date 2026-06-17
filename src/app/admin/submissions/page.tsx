import { prisma } from '@/lib/prisma';
import Link from 'next/link';

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

export default async function SubmissionsPage() {
  const submissions = await prisma.submission.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Quicksand', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.5rem' }}>Submissions List</h1>
        <Link href="/admin" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
          &larr; Back to Admin
        </Link>
      </div>

      <div className="card-panel" style={{ overflowX: 'auto', padding: '24px' }}>
        <table style={{ width: '100%', minWidth: '1100px', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
              <th style={{ padding: '12px 8px' }}>Submission Date</th>
              <th style={{ padding: '12px 8px' }}>Parent Name</th>
              <th style={{ padding: '12px 8px' }}>Parent Email</th>
              <th style={{ padding: '12px 8px' }}>Child DOB</th>
              <th style={{ padding: '12px 8px' }}>Age at Submission</th>
              <th style={{ padding: '12px 8px' }}>Speech Clarity Concern</th>
              <th style={{ padding: '12px 8px' }}>Total Score</th>
              <th style={{ padding: '12px 8px' }}>Communication Stage</th>
              <th style={{ padding: '12px 8px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((sub) => {
              const isClarityConcern = sub.speechClarity?.includes('CONCERN');
              return (
                <tr key={sub.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 8px' }}>
                    {sub.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td style={{ padding: '12px 8px' }}>{sub.parentName}</td>
                  <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>{sub.parentEmail}</td>
                  <td style={{ padding: '12px 8px' }}>
                    {sub.childDob.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td style={{ padding: '12px 8px' }}>{calculateAgeAtSubmission(sub.childDob, sub.createdAt)}</td>
                  <td style={{ padding: '12px 8px' }}>
                    <span style={{ 
                      color: isClarityConcern ? '#ef4444' : '#10b981',
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}>
                      {sub.speechClarity ? (isClarityConcern ? 'Concern' : 'No Concern') : 'N/A'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>{sub.totalScore}</td>
                  <td style={{ padding: '12px 8px' }}>
                    <span style={{ 
                      background: '#E2E2D1', 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '0.85rem', 
                      fontWeight: 600 
                    }}>
                      {sub.communicationStage}
                    </span>
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <Link href={`/admin/submissions/${sub.id}`}>
                      <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                        View Details
                      </button>
                    </Link>
                  </td>
                </tr>
              );
            })}
            {submissions.length === 0 && (
              <tr>
                <td colSpan={9} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No submissions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
