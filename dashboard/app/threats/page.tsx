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
    <div style={{ padding: 24 }}>
      <h1>Threat Management</h1>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="Pattern (domain or regex)" />
        <label><input type="checkbox" checked={isRegex} onChange={(e) => setIsRegex(e.target.checked)} /> Regex</label>
        <select value={severity} onChange={(e) => setSeverity(e.target.value as any)}>
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
        </select>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" />
        <button onClick={addThreat}>Add</button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th align="left">Pattern</th>
            <th>Regex</th>
            <th>Severity</th>
            <th>Notes</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {list.map(t => (
            <tr key={t.id}>
              <td>{t.pattern}</td>
              <td style={{ textAlign: 'center' }}>{t.isRegex ? '✓' : ''}</td>
              <td style={{ textTransform: 'capitalize', textAlign: 'center' }}>{t.severity}</td>
              <td>{t.notes}</td>
              <td style={{ textAlign: 'right' }}>
                <button onClick={() => removeThreat(t.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


