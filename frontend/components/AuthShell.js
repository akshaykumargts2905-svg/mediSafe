import Link from "next/link";
import Brand from "./Brand";
import Icon from "./Icon";

export default function AuthShell({ children, signup = false }) {
  return <main className="auth-wrap">
    <aside className="auth-story">
      <Brand light />
      <div className="auth-story-content">
        <span className="auth-story-label"><span className="status-dot" /> YOUR HEALTH, WITH CLARITY</span>
        <h2>A little clarity.<br /> A lot more<br /> <em>peace of mind.</em></h2>
        <p>Understand your medicines, stay informed, and feel more prepared for your next conversation with your care team.</p>
        <div className="auth-care-card"><span className="icon-tile"><Icon name="shield" size={26} /></span><div><b>Care, with clarity.</b><p>One place for your prescriptions,<br />safety checks, and care team.</p></div></div>
        <div className="auth-benefits"><span><Icon name="check" size={16} /> Prescription review</span><span><Icon name="check" size={16} /> Interaction checks</span></div>
      </div>
      <p className="auth-story-footer"><Icon name="heart" size={16} /> Thoughtfully designed around your care.</p>
      <div className="auth-orbit" aria-hidden="true" />
    </aside>
    <section className="auth-form-side">
      <div className="auth-topline"><Link href="/" className="back-link"><Icon name="arrow" size={16} /> Back to home</Link><span>{signup ? "Already a member?" : "New here?"} <Link href={signup ? "/login" : "/signup"}>{signup ? "Log in" : "Get started"} <span aria-hidden="true">↗</span></Link></span></div>
      <div className="auth-card">{children}</div>
      <p className="auth-bottom-note"><Icon name="shield" size={16} /> Your next step toward more informed care.</p>
    </section>
  </main>;
}
