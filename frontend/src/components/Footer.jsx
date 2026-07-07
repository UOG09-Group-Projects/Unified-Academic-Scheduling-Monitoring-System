import { AtSign } from "lucide-react";

const LINKS = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
  { label: "Privacy", href: "#" },
];

const SOCIALS = [
  { icon: AtSign, href: "#" ,label: "GitHub"},
  { icon: AtSign, href: "#" ,label: "Twitter"},
  { icon: AtSign, href: "#" ,label: "LinkedIn"},
];

export default function Footer() {
  return (
    <footer
  className="px-[5%] py-12"
  style={{ backgroundColor: "#0F172A" }}
>
      <div className="max-w-[1100px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-6 flex-wrap">
        {/* Logo */}
        <a
          href="#home"
          className="flex items-center gap-2 font-syne font-extrabold text-[1.1rem] text-white no-underline"
        >
          <span className="flex items-center gap-2 font-bold text-[1.1rem] text-white no-underline" />
          LightLearn
        </a>

        {/* Links */}
        <ul className="flex gap-6 list-none flex-wrap justify-center">
          {LINKS.map(({ label, href }) => (
            <li key={label}>
              <a
                href={href}
                className="text-white/40 text-[0.82rem] no-underline transition-colors duration-200 hover:text-white"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        {/* Socials + copyright */}
        <div className="flex flex-col items-center sm:items-end gap-3">
          <div className="flex gap-3">
            {SOCIALS.map(({ icon: Icon, href }) => (
              <a
                key={href}
                href={href}
                className="w-8 h-8 bg-white/[0.06] border border-white/10 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all duration-200"
              >
                <Icon size={14} />
              </a>
            ))}
          </div>
          <p className="text-white/30 text-[0.78rem]">
            © 2026 LightLearn. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}