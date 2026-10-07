"use client";
import { useRouter } from "next/navigation";
import ApiPanel from "../../components/ApiPanel";
import RecordForm from "../../components/RecordForm";
import { authApi } from "../../lib/services";
import { clearSession } from "../../lib/api";
export default function Profile() {
  const router = useRouter();
  return <ApiPanel title="Your profile" description="Manage the account you are signed in to." endpoint="/api/users/me">
    {({ data, refresh, run, busy }) => data?.user && <>
      <section className="panel"><h2>Account details</h2>
        <RecordForm key={JSON.stringify(data.user)} initial={data.user} fields={[{ name: "name", label: "Full name", required: true }, { name: "email", label: "Email address", type: "email", required: true }]} onSubmit={async (values) => { await authApi.update(values); await refresh(); }} />
      </section>
      <section className="panel"><h2>Change password</h2><RecordForm fields={[{ name: "password", label: "New password", type: "password", minLength: 8, required: true, autoComplete: "new-password", help: "At least 8 characters, at most 72 UTF-8 bytes." }]} onSubmit={async (values) => { await authApi.update(values); clearSession(); router.replace("/login"); }} /></section>
      <section className="panel"><h2>Delete account</h2><p>This removes your prescriptions and all their associated records.</p><button className="button danger" disabled={busy} onClick={async () => { if (confirm("Permanently delete your account and all prescription records?")) { const result = await run({ method: "DELETE", refresh: false }); if (result) { clearSession(); router.replace("/"); } } }}>Delete account</button></section>
    </>}
  </ApiPanel>;
}
