"use client";
import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

type Threat = {
  id: string;
  pattern: string;
  isRegex: boolean;
  severity: "low" | "medium" | "high";
  source?: string;
  notes?: string | null;
};

export default function ThreatsPage() {
  const [list, setList] = useState<Threat[]>([]);
  const [pattern, setPattern] = useState("");
  const [isRegex, setIsRegex] = useState(false);
  const [severity, setSeverity] = useState<Threat["severity"]>("high");
  const [notes, setNotes] = useState("");
  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : "";

  async function load() {
    const res = await fetch(`${API_BASE}/threats`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setList(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function addThreat() {
    const res = await fetch(`${API_BASE}/threats`, {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ pattern, isRegex, severity, notes }),
    });
    if (res.ok) {
      setPattern("");
      setNotes("");
      await load();
    }
  }

  async function removeThreat(id: string) {
    const res = await fetch(`${API_BASE}/threats/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) await load();
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f3f4f6 0%, #e0e7ff 100%)', padding: 32 }}>
      <div style={{ maxWidth: 900, margin: '0 auto', background: 'white', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.08)', padding: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 24, color: '#3730a3' }}>Threat Management</h1>
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="Pattern (domain or regex)" style={{ flex: 2, padding: 10, borderRadius: 8, border: '1px solid #c7d2fe', fontSize: 16 }} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 15, color: '#6366f1' }}>
            <input type="checkbox" checked={isRegex} onChange={(e) => setIsRegex(e.target.checked)} /> Regex
          </label>
          <select value={severity} onChange={(e) => setSeverity(e.target.value as any)} style={{ padding: 10, borderRadius: 8, border: '1px solid #c7d2fe', fontSize: 16 }}>
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </select>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" style={{ flex: 2, padding: 10, borderRadius: 8, border: '1px solid #c7d2fe', fontSize: 16 }} />
          <button onClick={addThreat} style={{ background: 'linear-gradient(90deg, #6366f1, #818cf8)', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, fontSize: 16, cursor: 'pointer', boxShadow: '0 2px 8px #6366f122' }}>Add</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
            <thead>
              <tr style={{ background: '#eef2ff' }}>
                <th align="left" style={{ padding: 12, fontWeight: 700, color: '#6366f1' }}>Pattern</th>
                <th style={{ padding: 12, fontWeight: 700, color: '#6366f1' }}>Regex</th>
                <th style={{ padding: 12, fontWeight: 700, color: '#6366f1' }}>Severity</th>
                <th style={{ padding: 12, fontWeight: 700, color: '#6366f1' }}>Notes</th>
                <th style={{ padding: 12 }}></th>
              </tr>
            </thead>
            <tbody>
              {list.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid #e0e7ff', background: t.severity === 'high' ? '#fef2f2' : t.severity === 'medium' ? '#fef9c3' : '#f0fdf4' }}>
                  <td style={{ padding: 12, fontFamily: 'monospace', fontSize: 15 }}>{t.pattern}</td>
                  <td style={{ textAlign: 'center', padding: 12 }}>{t.isRegex ? '✓' : ''}</td>
                  <td style={{ textTransform: 'capitalize', textAlign: 'center', padding: 12, fontWeight: 600, color: t.severity === 'high' ? '#dc2626' : t.severity === 'medium' ? '#ca8a04' : '#16a34a' }}>{t.severity}</td>
                  <td style={{ padding: 12 }}>{t.notes}</td>
                  <td style={{ textAlign: 'right', padding: 12 }}>
                    <button onClick={() => removeThreat(t.id)} style={{ background: '#f87171', color: 'white', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 4px #f8717111' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


