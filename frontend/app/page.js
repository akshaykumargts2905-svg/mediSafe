import Link from "next/link";
import Brand from "../components/Brand";
import Icon from "../components/Icon";

const features = [
  { icon: "prescription", title: "Your prescriptions, together.", text: "Keep prescription details in one place. Upload an image, review the extracted text, and confirm your medicines." },
  { icon: "interaction", title: "Understand the connections.", text: "Explore known drug and food interactions, with clear explanations to bring to your doctor or pharmacist." },
  { icon: "users", title: "Better conversations. Better care.", text: "Review safety reports and share your records with the doctors you choose, through your care team." },
];

export default function Home() {
  return <main className="landing" id="top">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="landing-nav page-width">
      <Brand />
      <nav className="landing-links" aria-label="About MediSafe"><a href="#your-care">Why MediSafe</a><a href="#how-it-works">How it works</a></nav>
      <div className="landing-nav-actions"><Link className="nav-login" href="/login">Log in <span aria-hidden="true">↗</span></Link><Link className="button button-small" href="/signup">Get started <Icon name="arrow" size={16} /></Link></div>
    </header>
    <section className="hero page-width" id="main-content">
      <div className="hero-content">
        <p className="hero-label"><span className="status-dot" /> A CLEARER VIEW OF YOUR MEDICINES</p>
        <h1>Your medicines.<br />A clearer<br /><em>picture.</em></h1>
        <p className="hero-copy">More confidence in every medicine decision. Bring prescriptions, interaction checks, and safety insights together in one thoughtful space.</p>
        <div className="hero-actions"><Link className="button button-large" href="/signup">Create your account <Icon name="arrow" /></Link><a className="button secondary button-large" href="#how-it-works">Explore MediSafe <Icon name="chevron" size={17} /></a></div>
        <div className="hero-reassurance"><span><Icon name="shield" size={17} /> Informed decisions</span><span><Icon name="heart" size={17} /> Care that connects</span></div>
      </div>
      <div className="hero-visual" aria-label="Illustration of the MediSafe prescription review experience">
        <div className="visual-orbit orbit-one" aria-hidden="true" /><div className="visual-orbit orbit-two" aria-hidden="true" />
        <span className="visual-plus plus-one" aria-hidden="true">+</span><span className="visual-plus plus-two" aria-hidden="true">+</span>
        <div className="floating-note"><span className="icon-tile"><Icon name="heart" /></span><div><b>A little more peace of mind.</b><span>Starts with understanding.</span></div></div>
        <div className="preview-card">
          <div className="preview-top"><span className="preview-brand"><Icon name="plus" size={18} /> MediSafe</span><span className="preview-demo">EXPERIENCE PREVIEW</span></div>
          <div className="preview-heading"><p>Your care, connected.</p><h2>Let’s see the whole picture.</h2></div>
          <div className="preview-prescription"><span className="icon-tile"><Icon name="prescription" size={23} /></span><div><b>Your prescription</b><span>Every detail, in one place</span></div><Icon name="chevron" size={17} /></div>
          <div className="preview-check"><div className="preview-check-heading"><span className="icon-tile"><Icon name="interaction" size={21} /></span><b>Know what to review</b></div><p>Make sense of potential interactions before your next care conversation.</p><div className="preview-tags"><span><Icon name="pill" size={14} /> Medicines</span><span><Icon name="leaf" size={14} /> Food & nutrition</span></div></div>
          <div className="preview-footer"><Icon name="users" size={20} /><span>You and your care team.<br /><b>On the same page.</b></span><span className="preview-checkmark"><Icon name="check" size={16} /></span></div>
        </div>
        <div className="floating-safety"><span className="safety-seal"><Icon name="shield" size={24} /></span><div><b>Clarity at every step</b><span>From prescription to conversation</span></div></div>
        <p className="visual-caption">A calmer space for your medication journey.</p>
      </div>
    </section>
    <div className="care-strip"><div className="page-width"><p>THOUGHTFUL TOOLS. MORE INFORMED CARE.</p><span><Icon name="prescription" /> Prescription review</span><span><Icon name="interaction" /> Drug & food checks</span><span><Icon name="report" /> Clear safety reports</span></div></div>
    <section className="landing-section page-width" id="your-care">
      <div className="section-heading"><div><p className="eyebrow">BUILT AROUND YOUR CARE</p><h2>Less scattered information.<br /><em>More understanding.</em></h2></div><p>Health information can feel overwhelming.<br />Your medication workspace shouldn’t.</p></div>
      <div className="feature-grid">{features.map((feature, index) => <article className="feature-card" key={feature.title}><div className="feature-top"><span className="icon-tile"><Icon name={feature.icon} size={25} /></span><span>0{index + 1}</span></div><h3>{feature.title}</h3><p>{feature.text}</p></article>)}</div>
    </section>
    <section className="how-section page-width" id="how-it-works">
      <div className="how-intro"><p className="eyebrow">A SIMPLE PLACE TO START</p><h2>Small steps.<br /><em>A clearer path.</em></h2><Link className="text-link" href="/signup">Start your medication journey <Icon name="arrow" size={18} /></Link></div>
      <ol className="care-steps"><li><span>01</span><div><h3>Bring your prescriptions together</h3><p>Add a prescription image or enter the details yourself.</p></div></li><li><span>02</span><div><h3>Review what matters</h3><p>Confirm your medicines and explore known interactions.</p></div></li><li><span>03</span><div><h3>Connect with your care team</h3><p>Use your safety insights to support informed conversations.</p></div></li></ol>
    </section>
    <section className="landing-cta page-width"><div><p className="eyebrow">YOUR NEXT STEP, WITH CONFIDENCE</p><h2>A little clarity goes a long way.</h2><p>Make space for a more informed medication journey.</p></div><Link className="button button-large" href="/signup">Create your account <Icon name="arrow" /></Link></section>
    <footer className="landing-footer page-width"><div><Brand /><p>Designed to make medication safety easier to understand.</p></div><p>MediSafe supports conversations with your care team.<br />It does not replace professional medical advice.</p><a className="back-to-top" href="#top" aria-label="Back to top"><Icon name="arrow" /></a></footer>
  </main>;
}
