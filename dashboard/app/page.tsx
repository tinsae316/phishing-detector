"use client";
import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export default function DashboardPage() {
  const [stats, setStats] = useState<{ total: number; unsafe: number; suspicious: number } | null>(null);

  useEffect(() => {
    // Basic stats without auth: count by verdict (demo; would normally be protected)
    fetch(`${API_BASE}/logs`, { headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` } })
      .then((r) => r.json())
      .then((logs) => {
        if (!Array.isArray(logs)) return;
        const total = logs.length;
        const unsafe = logs.filter((l) => l.verdict === "unsafe").length;
        const suspicious = logs.filter((l) => l.verdict === "suspicious").length;
        setStats({ total, unsafe, suspicious });
      })
      .catch(() => setStats({ total: 0, unsafe: 0, suspicious: 0 }));
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>Admin Dashboard</h1>
      <p>Backend: {API_BASE}</p>
      {stats ? (
        <div style={{ display: 'flex', gap: 16 }}>
          <Stat title="Total Scans" value={stats.total} />
          <Stat title="Unsafe" value={stats.unsafe} />
          <Stat title="Suspicious" value={stats.suspicious} />
        </div>
      ) : (
        <p>Loading…</p>
      )}
    </div>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div style={{ border: '1px solid #eaeaea', borderRadius: 8, padding: 16, minWidth: 160 }}>
      <div style={{ fontSize: 12, color: '#666' }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
    </div>
  );
}


