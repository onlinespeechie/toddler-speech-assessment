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
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto', fontFamily: "'Quicksand', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.5rem', margin: 0 }}>Submissions List</h1>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Link href="/admin/analytics" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 600 }}>
            Analytics
          </Link>
          <span style={{ color: '#ccc' }}>|</span>
          <Link href="/admin" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 600 }}>
            &larr; Back to Admin
          </Link>
        </div>
      </div>

      <div className="card-panel" style={{ overflowX: 'auto', padding: '24px 16px' }}>
        <table style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
              <th style={{ padding: '12px 8px', width: '1%' }}>Submission Date</th>
              <th style={{ padding: '12px 8px' }}>Parent Name</th>
              <th style={{ padding: '12px 8px' }}>Parent Email</th>
              <th style={{ padding: '12px 8px', width: '1%' }}>Age at Submission</th>
              <th style={{ padding: '12px 8px', width: '1%' }}>Score</th>
              <th style={{ padding: '12px 8px', width: '1%' }}>Status</th>
              <th style={{ padding: '12px 8px', width: '1%' }}>Comm Stage</th>
              <th style={{ padding: '12px 8px', width: '1%' }}>Speech Clarity Concern</th>
              <th style={{ padding: '12px 8px', width: '1%' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((sub) => {
              return (
                <tr key={sub.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 8px', whiteSpace: 'nowrap' }}>
                    {sub.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td style={{ padding: '12px 8px' }}>{sub.parentName}</td>
                  <td title={sub.parentEmail} style={{ padding: '12px 8px', color: 'var(--text-muted)', whiteSpace: 'nowrap', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub.parentEmail}</td>
                  <td style={{ padding: '12px 8px', whiteSpace: 'nowrap' }}>{calculateAgeAtSubmission(sub.childDob, sub.createdAt)}</td>
                  <td style={{ padding: '12px 8px', fontWeight: 700 }}>{sub.totalScore}</td>
                  <td style={{ padding: '12px 8px', fontWeight: 700, color: sub.scoreStatus === 'On Track' ? '#10b981' : '#f59e0b' }}>
                    {sub.scoreStatus}
                  </td>
                  <td style={{ padding: '12px 8px', minWidth: '140px' }}>{sub.communicationStage}</td>
                  <td style={{ padding: '12px 8px', fontWeight: 700, color: sub.speechClarity === 'SPEECH CLARITY CONCERN' ? '#ef4444' : '#10b981' }}>
                    {/* the values are 'SPEECH CLARITY CONCERN' / 'NO CONCERN' (null on older submissions) */}
                    {sub.speechClarity ? (sub.speechClarity === 'SPEECH CLARITY CONCERN' ? 'Yes' : 'No') : 'N/A'}
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <Link href={`/admin/submissions/${sub.id}`}>
                      <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
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
