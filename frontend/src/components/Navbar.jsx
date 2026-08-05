import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "./ui/Button";
import logo from "../assets/logoll.png";

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
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Which section is "active" for the underline — an IntersectionObserver
  // instead of a per-scroll-frame querySelectorAll + offset loop. Sections
  // below the fold are code-split/lazy-loaded (see Home.jsx), so a
  // MutationObserver picks up section[id] elements that mount after this
  // effect first runs.
  useEffect(() => {
    const observed = new Set();
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );

    const observeAll = () => {
      document.querySelectorAll("section[id]").forEach((s) => {
        if (!observed.has(s)) {
          observed.add(s);
          sectionObserver.observe(s);
        }
      });
    };

    observeAll();
    const mutationObserver = new MutationObserver(observeAll);
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      sectionObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return (
    <motion.nav
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-[5%] h-[72px] transition-all duration-300 ${
        scrolled
          ? "bg-white/70 backdrop-blur-xl border-b border-ocean-100 shadow-soft"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <a href="#home" className="flex items-center gap-2 no-underline">
        <img src={logo} alt="LightLearn" className="w-8 h-8 rounded-xl object-cover shadow-soft" />
        <span className="font-display text-[1.2rem] font-bold tracking-tight text-ink">
          LightLearn
        </span>
      </a>

      <ul className="hidden md:flex items-center gap-8 list-none">
        {NAV_LINKS.map(({ label, href }) => {
          const id = href.replace("#", "");
          return (
            <li key={label} className="relative">
              <a
                href={href}
                className={`text-sm font-medium transition-colors duration-200 no-underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/40 ${
                  active === id ? "text-ink" : "text-ink-faint hover:text-ink"
                }`}
              >
                {label}
              </a>
              {active === id && (
                <motion.span
                  layoutId="nav-underline"
                  className="absolute -bottom-1.5 left-0 right-0 h-[2px] bg-ocean-600 rounded-full"
                />
              )}
            </li>
          );
        })}
      </ul>

      <div className="hidden md:flex gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate("/register-institution")}>
          Register institution
        </Button>
        <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
          Sign in
        </Button>
        <Button variant="oceanSolid" size="sm" onClick={() => navigate("/login")}>
          Get started
        </Button>
      </div>

      <button
        onClick={() => setMobileOpen((o) => !o)}
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
        aria-expanded={mobileOpen}
        aria-controls="mobile-nav"
        className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/40"
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {mobileOpen && (
        <motion.div
          id="mobile-nav"
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
