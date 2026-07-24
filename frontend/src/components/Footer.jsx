import { Globe, AtSign, Link2, GraduationCap } from "lucide-react";

const LINKS = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
  { label: "Privacy", href: "#" },
];

const SOCIALS = [
  { icon: Globe, href: "#", label: "Website" },
  { icon: AtSign, href: "#", label: "Email" },
  { icon: Link2, href: "#", label: "LinkedIn" },
];

export default function Footer() {
  return (
    <footer className="relative px-[5%] py-12 bg-ink">
      <div className="absolute top-0 left-0 right-0 h-px bg-white/10" />

      <div className="max-w-[1100px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-6 flex-wrap">
        <a href="#home" className="flex items-center gap-2 no-underline">
          <span className="w-7 h-7 rounded-xl bg-brand-600 flex items-center justify-center">
            <GraduationCap size={14} strokeWidth={2.4} className="text-white" />
          </span>
          <span className="font-display font-bold text-[1.05rem] text-white">LightLearn</span>
        </a>

        <ul className="flex gap-6 list-none flex-wrap justify-center">
          {LINKS.map(({ label, href }) => (
            <li key={label}>
              <a href={href} className="text-white/40 text-[0.82rem] no-underline transition-colors duration-200 hover:text-brand-300">
                {label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex flex-col items-center sm:items-end gap-3">
          <div className="flex gap-3">
            {SOCIALS.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="w-8 h-8 bg-white/[0.06] border border-white/10 rounded-xl flex items-center justify-center text-white/40 hover:text-brand-300 hover:bg-white/10 transition-all duration-200"
              >
                <Icon size={14} />
              </a>
            ))}
          </div>
          <p className="text-white/30 text-[0.78rem]">© 2026 LightLearn. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
