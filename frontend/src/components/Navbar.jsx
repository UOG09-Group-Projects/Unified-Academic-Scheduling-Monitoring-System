import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GraduationCap, Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "./ui/Button";

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [active, setActive] = useState("home");
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      const sections = document.querySelectorAll("section[id]");
      let current = "";
      sections.forEach((s) => {
        if (window.scrollY >= s.offsetTop - 120) current = s.id;
      });
      if (current) setActive(current);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-[5%] h-[72px] transition-all duration-300 ${
        scrolled
          ? "bg-white/70 backdrop-blur-xl border-b border-white/60 shadow-soft"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <a href="#home" className="flex items-center gap-2 no-underline">
        <span className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center shadow-soft">
          <GraduationCap size={16} strokeWidth={2.4} className="text-white" />
        </span>
        <span className="font-display text-[1.2rem] font-bold tracking-tight text-ink">
          LightLearn
        </span>
      </a>

      <ul className="hidden md:flex items-center gap-8 list-none">
        {NAV_LINKS.map(({ label, href }) => (
          <li key={label} className="relative">
            <a
              href={href}
              className={`text-sm font-medium transition-colors duration-200 no-underline ${
                active === href.replace("#", "") ? "text-ink" : "text-ink-faint hover:text-ink"
              }`}
            >
              {label}
            </a>
            {active === href.replace("#", "") && (
              <motion.span
                layoutId="nav-underline"
                className="absolute -bottom-1.5 left-0 right-0 h-[2px] bg-brand-600 rounded-full"
              />
            )}
          </li>
        ))}
      </ul>

      <div className="hidden md:flex gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate("/register-institution")}>
          Register institution
        </Button>
        <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
          Sign in
        </Button>
        <Button variant="brand" size="sm" onClick={() => navigate("/login")}>
          Get started
        </Button>
      </div>

      <button
        onClick={() => setMobileOpen((o) => !o)}
        className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center text-ink"
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden absolute top-[72px] left-0 right-0 bg-white/85 backdrop-blur-xl border-b border-white/60 shadow-lift px-[5%] py-5 flex flex-col gap-4"
        >
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="text-sm font-medium text-ink-soft no-underline"
            >
              {label}
            </a>
          ))}
          <div className="flex flex-col gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/register-institution")}>
              Register institution
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate("/login")}>
                Sign in
              </Button>
              <Button variant="brand" size="sm" className="flex-1" onClick={() => navigate("/login")}>
                Get started
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}
