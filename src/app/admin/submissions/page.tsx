import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SubmissionsPage() {
  const submissions = await prisma.submission.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto', fontFamily: "'Quicksand', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.5rem' }}>Submissions List</h1>
        <Link href="/admin" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
          &larr; Back to Admin
        </Link>
      </div>

      <div className="card-panel">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
              <th style={{ padding: '12px 8px' }}>Submission Date</th>
              <th style={{ padding: '12px 8px' }}>Parent Name</th>
              <th style={{ padding: '12px 8px' }}>Total Score</th>
              <th style={{ padding: '12px 8px' }}>Communication Stage</th>
              <th style={{ padding: '12px 8px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((sub) => (
              <tr key={sub.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '12px 8px' }}>{sub.createdAt.toLocaleDateString()}</td>
                <td style={{ padding: '12px 8px' }}>{sub.parentName}</td>
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
            ))}
            {submissions.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
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
