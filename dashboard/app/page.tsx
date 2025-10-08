"use client";
import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

interface Stats {
  total: number;
  unsafe: number;
  suspicious: number;
  safe: number;
}

interface RecentLog {
  id: string;
  url: string;
  verdict: string;
  score: number;
  createdAt: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentLogs, setRecentLogs] = useState<RecentLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    // Fetch stats and recent logs
    Promise.all([
      fetch(`${API_BASE}/logs`, { 
        headers: { Authorization: `Bearer ${token}` } 
      }),
      fetch(`${API_BASE}/logs?limit=10`, { 
        headers: { Authorization: `Bearer ${token}` } 
      })
    ])
    .then(([statsRes, logsRes]) => Promise.all([statsRes.json(), logsRes.json()]))
    .then(([allLogs, recentLogsData]) => {
      if (Array.isArray(allLogs)) {
        const total = allLogs.length;
        const unsafe = allLogs.filter((l) => l.verdict === "unsafe").length;
        const suspicious = allLogs.filter((l) => l.verdict === "suspicious").length;
        const safe = allLogs.filter((l) => l.verdict === "safe").length;
        setStats({ total, unsafe, suspicious, safe });
      }
      
      if (Array.isArray(recentLogsData)) {
        setRecentLogs(recentLogsData.slice(0, 10));
      }
    })
    .catch(() => {
      setStats({ total: 0, unsafe: 0, suspicious: 0, safe: 0 });
    })
    .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '4px solid #6366f1', borderTop: '4px solid #e0e7ff', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: '#64748b' }}>Loading dashboard...</p>
        </div>
        <style>{`@keyframes spin { 0%{transform:rotate(0deg);} 100%{transform:rotate(360deg);} }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f3f4f6 0%, #e0e7ff 100%)' }}>
      {/* Header */}
      <header style={{ background: 'white', boxShadow: '0 2px 8px #6366f111', borderBottom: '1px solid #e0e7ff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '32px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ height: 32, width: 32, background: 'linear-gradient(90deg, #6366f1, #818cf8)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg style={{ height: 20, width: 20, color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div style={{ marginLeft: 12 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: '#3730a3', margin: 0 }}>Phishing Guard</h1>
                <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>Admin Dashboard</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 14, color: '#64748b' }}>Backend: {API_BASE}</span>
              <a href="/threats" style={{ background: '#6366f1', color: 'white', padding: '10px 20px', borderRadius: 8, fontWeight: 600, fontSize: 15, textDecoration: 'none', boxShadow: '0 2px 8px #6366f122', marginRight: 4 }}>Threats</a>
              <a href="/logs" style={{ background: '#818cf8', color: 'white', padding: '10px 20px', borderRadius: 8, fontWeight: 600, fontSize: 15, textDecoration: 'none', boxShadow: '0 2px 8px #818cf822', marginRight: 4 }}>Logs</a>
              <button
                onClick={handleLogout}
                style={{ background: '#ef4444', color: 'white', padding: '10px 24px', borderRadius: 8, fontWeight: 600, fontSize: 15, border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px #ef444411' }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 32px 0 32px' }}>
        {/* Stats Grid */}
        {stats && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 32 }}>
            <StatCard
              title="Total Scans"
              value={stats.total}
              icon="🔍"
              color="#6366f1"
              bg="#eef2ff"
              description="All URL scans performed"
            />
            <StatCard
              title="Unsafe URLs"
              value={stats.unsafe}
              icon="🚫"
              color="#dc2626"
              bg="#fef2f2"
              description="Blocked malicious sites"
            />
            <StatCard
              title="Suspicious URLs"
              value={stats.suspicious}
              icon="⚠️"
              color="#ca8a04"
              bg="#fef9c3"
              description="Flagged for review"
            />
            <StatCard
              title="Safe URLs"
              value={stats.safe}
              icon="✅"
              color="#16a34a"
              bg="#f0fdf4"
              description="Verified safe sites"
            />
          </div>
        )}

        {/* Recent Activity */}
        <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 4px 16px #6366f111', border: '1px solid #e0e7ff', marginBottom: 32 }}>
          <div style={{ padding: '24px 32px', borderBottom: '1px solid #e0e7ff' }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#3730a3', margin: 0 }}>Recent Activity</h2>
            <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>Latest URL scans and detections</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
              <thead>
                <tr style={{ background: '#f3f4f6' }}>
                  <th style={{ padding: 12, textAlign: 'left', color: '#6366f1', fontWeight: 700 }}>URL</th>
                  <th style={{ padding: 12, textAlign: 'left', color: '#6366f1', fontWeight: 700 }}>Verdict</th>
                  <th style={{ padding: 12, textAlign: 'left', color: '#6366f1', fontWeight: 700 }}>Risk Score</th>
                  <th style={{ padding: 12, textAlign: 'left', color: '#6366f1', fontWeight: 700 }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.length > 0 ? (
                  recentLogs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #e0e7ff', background: log.verdict === 'unsafe' ? '#fef2f2' : log.verdict === 'suspicious' ? '#fef9c3' : '#f0fdf4' }}>
                      <td style={{ padding: 12, maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>{log.url}</td>
                      <td style={{ padding: 12, textAlign: 'center', fontWeight: 600, color: log.verdict === 'unsafe' ? '#dc2626' : log.verdict === 'suspicious' ? '#ca8a04' : '#16a34a', textTransform: 'capitalize' }}>{log.verdict}</td>
                      <td style={{ padding: 12, textAlign: 'center' }}>{log.score}/100</td>
                      <td style={{ padding: 12, color: '#64748b' }}>{new Date(log.createdAt).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>
                      No recent activity
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, color, bg, description }: { 
  title: string; 
  value: number; 
  icon: string; 
  color: string; 
  bg: string; 
  description: string; 
}) {
  return (
    <div style={{ background: bg, borderRadius: 12, boxShadow: '0 2px 8px #6366f111', border: `1px solid ${color}22`, padding: 24, flex: 1, minWidth: 180 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 32 }}>{icon}</div>
        <div>
          <div style={{ fontSize: 15, color: color, fontWeight: 600 }}>{title}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#3730a3' }}>{value.toLocaleString()}</div>
        </div>
      </div>
      <div style={{ marginTop: 8, fontSize: 13, color: '#64748b' }}>{description}</div>
    </div>
  );
}


