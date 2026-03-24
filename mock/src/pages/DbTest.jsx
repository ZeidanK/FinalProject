import { useState } from 'react';

export default function DbTest() {
  const [status, setStatus] = useState(null); // null | 'loading' | 'ok' | 'error'
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  async function runTest() {
    setStatus('loading');
    setData(null);
    setError(null);
    try {
      const res = await fetch('/api/db-test');
      const json = await res.json();
      if (json.success) {
        setData(json);
        setStatus('ok');
      } else {
        setError(json);
        setStatus('error');
      }
    } catch (err) {
      setError({ error: err.message });
      setStatus('error');
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: 10, padding: '2.5rem 3rem', boxShadow: '0 2px 16px rgba(0,0,0,0.10)', maxWidth: 480, width: '100%' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, color: '#1e293b' }}>Database Connection Test</h1>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28 }}>
          Tests connection to <strong>dbo.Apartments</strong> and returns the row count.
        </p>

        <button
          onClick={runTest}
          disabled={status === 'loading'}
          style={{
            width: '100%', padding: '10px 0', borderRadius: 6, border: 'none',
            background: status === 'loading' ? '#94a3b8' : '#2563eb',
            color: '#fff', fontSize: 15, fontWeight: 600, cursor: status === 'loading' ? 'not-allowed' : 'pointer',
            marginBottom: 24
          }}
        >
          {status === 'loading' ? 'Testing…' : 'Test Connection'}
        </button>

        {status === 'ok' && data && (
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '1rem 1.25rem' }}>
            <div style={{ color: '#16a34a', fontWeight: 700, fontSize: 16, marginBottom: 10 }}>✓ Connection successful</div>
            <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
              <tbody>
                <Row label="Server" value={data.server} />
                <Row label="Database" value={data.database} />
                <Row label="Rows in dbo.Apartments" value={data.rowCount} highlight />
              </tbody>
            </table>
          </div>
        )}

        {status === 'error' && error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '1rem 1.25rem' }}>
            <div style={{ color: '#dc2626', fontWeight: 700, fontSize: 16, marginBottom: 10 }}>✗ Connection failed</div>
            {error.server && <Row label="Server" value={error.server} />}
            {error.database && <Row label="Database" value={error.database} />}
            {error.code && (
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#7f1d1d', fontWeight: 600 }}>Error code: </span>
                <code style={{ fontSize: 13, background: '#fee2e2', borderRadius: 4, padding: '1px 6px' }}>{error.code}</code>
              </div>
            )}
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 13, color: '#7f1d1d', fontWeight: 600, marginBottom: 4 }}>Error message:</div>
              <pre style={{ background: '#fee2e2', borderRadius: 6, padding: '0.6rem 0.8rem', fontSize: 12, color: '#991b1b', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
                {error.error}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, highlight }) {
  return (
    <tr>
      <td style={{ paddingBottom: 6, color: '#374151', fontSize: 13, fontWeight: 600, width: '55%' }}>{label}</td>
      <td style={{ paddingBottom: 6, color: highlight ? '#15803d' : '#1e293b', fontWeight: highlight ? 700 : 400, fontSize: highlight ? 15 : 13 }}>{value}</td>
    </tr>
  );
}
