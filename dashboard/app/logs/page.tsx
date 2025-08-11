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
    <div style={{ padding: 24 }}>
      <h1>Detection Logs</h1>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input placeholder="Search URL" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
          <option value="">any</option>
          <option value="unsafe">unsafe</option>
          <option value="suspicious">suspicious</option>
          <option value="safe">safe</option>
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <button onClick={load}>Search</button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th align="left">Time</th>
            <th align="left">URL</th>
            <th>Verdict</th>
            <th>Score</th>
            <th align="left">Reasons</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(l => (
            <tr key={l.id}>
              <td>{new Date(l.createdAt).toLocaleString()}</td>
              <td style={{ maxWidth: 420, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.url}</td>
              <td style={{ textTransform: 'capitalize', textAlign: 'center' }}>{l.verdict}</td>
              <td style={{ textAlign: 'center' }}>{l.score.toFixed(0)}</td>
              <td>{(() => { try { return (JSON.parse(l.reasons) as string[]).join(', '); } catch { return l.reasons; } })()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


