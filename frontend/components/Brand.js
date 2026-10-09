import Link from "next/link";
import Icon from "./Icon";

export default function Brand({ href = "/", light = false }) {
  return <Link className={`brand${light ? " brand-light" : ""}`} href={href} aria-label="MediSafe home">
    <span className="brand-mark"><Icon name="plus" size={25} /></span>
    <span>Medi<span className="brand-accent">Safe</span><small>MEDICATION SAFETY</small></span>
  </Link>;
}
