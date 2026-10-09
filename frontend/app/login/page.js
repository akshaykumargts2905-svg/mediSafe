"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { api, json, saveSession } from "../../lib/api";
import { saveLanguage } from "../../lib/language";
import AuthShell from "../../components/AuthShell";
import Icon from "../../components/Icon";

function LoginContent() {
  const params = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError("");
    const f = new FormData(e.currentTarget);
    try {
      const r = await api("/api/auth/login", json("POST", { email: f.get("email"), password: f.get("password") }));
      saveSession(r.token);
      saveLanguage(r.user.language || "en");
      window.location.replace("/dashboard");
    } catch (x) { setError(x.message); } finally { setBusy(false); }
  }
  return <AuthShell>
    <span className="auth-heading-icon icon-tile"><Icon name="shield" size={27} /></span>
    <p className="eyebrow">WELCOME BACK</p>
    <h1>Log in to MediSafe</h1>
    <p className="subheading">A clearer picture of your care starts here.<br />Review your prescriptions and safety updates.</p>
    {params.get("registered") && <p className="feedback success" role="status">Account created. Log in to continue.</p>}
    {params.get("reason") === "expired" && <p className="feedback" role="status">Your session expired. Please log in again.</p>}
    <form onSubmit={submit}>
      <label htmlFor="email">Email address</label>
      <div className="input-with-icon"><Icon name="mail" size={19} /><input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></div>
      <label htmlFor="password">Password</label>
      <div className="input-with-icon"><Icon name="lock" size={19} /><input id="password" name="password" type="password" autoComplete="current-password" placeholder="Enter your password" required /></div>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="button" disabled={busy}>{busy ? "Signing in…" : "Log in"}<Icon name="arrow" size={18} /></button>
    </form>
    <p className="auth-help">New to MediSafe? <Link href="/signup">Create an account</Link></p>
    <div className="auth-card-note"><Icon name="heart" size={17} /><p>Your medicines. Your care team.<br /><b>One thoughtful space.</b></p></div>
  </AuthShell>;
}

export default function Login() {
  return <Suspense fallback={<div className="session-loading"><Icon name="shield" size={32} /><p role="status">Loading login…</p></div>}><LoginContent /></Suspense>;
}
