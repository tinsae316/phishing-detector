"use client";
import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

type Log = {
  id: string;
  url: string;
  verdict: string;
  score: number;
  reasons: string;
  matchedThreatIds?: string | null;
  createdAt: string;
};

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [q, setQ] = useState("");
  const [severity, setSeverity] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : "";

  async function load() {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (severity) params.set("severity", severity);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const res = await fetch(`${API_BASE}/logs?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setLogs(await res.json());
  }

  useEffect(() => { load(); }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f3f4f6 0%, #e0e7ff 100%)', padding: 32 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', background: 'white', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.08)', padding: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 24, color: '#3730a3' }}>Detection Logs</h1>
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <input placeholder="Search URL" value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: 2, padding: 10, borderRadius: 8, border: '1px solid #c7d2fe', fontSize: 16 }} />
          <select value={severity} onChange={(e) => setSeverity(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #c7d2fe', fontSize: 16 }}>
            <option value="">any</option>
            <option value="unsafe">unsafe</option>
            <option value="suspicious">suspicious</option>
            <option value="safe">safe</option>
          </select>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #c7d2fe', fontSize: 16 }} />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #c7d2fe', fontSize: 16 }} />
          <button onClick={load} style={{ background: 'linear-gradient(90deg, #6366f1, #818cf8)', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, fontSize: 16, cursor: 'pointer', boxShadow: '0 2px 8px #6366f122' }}>Search</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', fontSize: 15 }}>
            <thead>
              <tr style={{ background: '#eef2ff' }}>
                <th align="left" style={{ padding: 12, fontWeight: 700, color: '#6366f1' }}>Time</th>
                <th align="left" style={{ padding: 12, fontWeight: 700, color: '#6366f1' }}>URL</th>
                <th style={{ padding: 12, fontWeight: 700, color: '#6366f1' }}>Verdict</th>
                <th style={{ padding: 12, fontWeight: 700, color: '#6366f1' }}>Score</th>
                <th align="left" style={{ padding: 12, fontWeight: 700, color: '#6366f1' }}>Reasons</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id} style={{ borderBottom: '1px solid #e0e7ff', background: l.verdict === 'unsafe' ? '#fef2f2' : l.verdict === 'suspicious' ? '#fef9c3' : '#f0fdf4' }}>
                  <td style={{ padding: 12, color: '#64748b' }}>{new Date(l.createdAt).toLocaleString()}</td>
                  <td style={{ maxWidth: 420, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: 12, fontFamily: 'monospace' }}>{l.url}</td>
                  <td style={{ textTransform: 'capitalize', textAlign: 'center', padding: 12, fontWeight: 600, color: l.verdict === 'unsafe' ? '#dc2626' : l.verdict === 'suspicious' ? '#ca8a04' : '#16a34a' }}>{l.verdict}</td>
                  <td style={{ textAlign: 'center', padding: 12 }}>{l.score.toFixed(0)}</td>
                  <td style={{ padding: 12 }}>{(() => { try { return (JSON.parse(l.reasons) as string[]).join(', '); } catch { return l.reasons; } })()}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>
                    No logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


