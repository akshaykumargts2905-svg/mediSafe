"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, json } from "../../lib/api";
import AuthShell from "../../components/AuthShell";
import Icon from "../../components/Icon";

export default function Signup() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError("");
    const f = new FormData(e.currentTarget);
    try {
      await api("/api/auth/register", json("POST", { name: f.get("name"), email: f.get("email"), password: f.get("password") }));
      router.push("/login?registered=1");
    } catch (x) { setError(x.message); } finally { setBusy(false); }
  }
  return <AuthShell signup>
    <span className="auth-heading-icon icon-tile"><Icon name="heart" size={27} /></span>
    <p className="eyebrow">LET’S GET STARTED</p>
    <h1>Create your account</h1>
    <p className="subheading">A little more clarity for your everyday care.<br />Keep your medication details in one place.</p>
    <form onSubmit={submit}>
      <label htmlFor="name">Full name</label>
      <div className="input-with-icon"><Icon name="user" size={19} /><input id="name" name="name" autoComplete="name" placeholder="Your full name" required /></div>
      <label htmlFor="email">Email address</label>
      <div className="input-with-icon"><Icon name="mail" size={19} /><input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></div>
      <label htmlFor="password">Password</label>
      <div className="input-with-icon"><Icon name="lock" size={19} /><input id="password" name="password" type="password" autoComplete="new-password" placeholder="Create a password" minLength="8" aria-describedby="password-help" required /></div>
      <small id="password-help" className="field-hint">Use at least 8 characters.</small>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="button" disabled={busy}>{busy ? "Creating account…" : "Create account"}<Icon name="arrow" size={18} /></button>
    </form>
    <p className="auth-help">Already have an account? <Link href="/login">Log in</Link></p>
    <div className="auth-card-note"><Icon name="shield" size={18} /><p>Built to support your care conversations.<br /><b>Always alongside your healthcare professional.</b></p></div>
  </AuthShell>;
}
