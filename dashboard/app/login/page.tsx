"use client";
import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("Admin@12345");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Login failed");
      localStorage.setItem("token", json.token);
      window.location.href = "/";
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e0e7ff 0%, #f3f4f6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 400, background: 'white', borderRadius: 18, boxShadow: '0 8px 32px rgba(59, 130, 246, 0.10)', padding: 32, position: 'relative', zIndex: 1 }}>
        {/* Logo/Icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px #6366f122' }}>
            <svg style={{ width: 32, height: 32, color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>
        {/* Headline & Subtitle */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#3730a3', margin: 0 }}>Welcome Back</h1>
          <p style={{ color: '#64748b', fontSize: 15, margin: '8px 0 0 0' }}>Sign in to your Phishing Guard Admin Dashboard</p>
        </div>
        {/* Login Form */}
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label htmlFor="email" style={{ display: 'block', fontSize: 15, fontWeight: 500, color: '#6366f1', marginBottom: 6 }}>Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', background: '#f3f4f6', border: '1px solid #c7d2fe', borderRadius: 8, color: '#22223b', fontSize: 16 }}
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <label htmlFor="password" style={{ display: 'block', fontSize: 15, fontWeight: 500, color: '#6366f1', marginBottom: 6 }}>Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', background: '#f3f4f6', border: '1px solid #c7d2fe', borderRadius: 8, color: '#22223b', fontSize: 16 }}
              placeholder="Enter your password"
              required
            />
          </div>
          {error && (
            <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#b91c1c', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg style={{ width: 18, height: 18, color: '#ef4444' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? 'linear-gradient(135deg, #6b7280, #4b5563)' : 'linear-gradient(135deg, #6366f1, #818cf8)',
              color: 'white',
              fontWeight: 600,
              fontSize: 17,
              padding: '12px 0',
              borderRadius: 8,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 8,
              boxShadow: '0 2px 8px #6366f122',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              transition: 'all 0.2s ease'
            }}
          >
            {loading ? (
              <div style={{ width: 20, height: 20, border: '3px solid #fff', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            ) : (
              <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            )}
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        {/* Footer */}
        <div style={{ marginTop: 32, textAlign: 'center', color: '#a1a1aa', fontSize: 13 }}>
          <span>© {new Date().getFullYear()} Phishing Guard. All rights reserved.</span>
          <div style={{ marginTop: 6, fontSize: 12 }}>Your credentials are encrypted and secure.</div>
        </div>
        <style>{`@keyframes spin { 0%{transform:rotate(0deg);} 100%{transform:rotate(360deg);} }`}</style>
      </div>
    </div>
  );
}


