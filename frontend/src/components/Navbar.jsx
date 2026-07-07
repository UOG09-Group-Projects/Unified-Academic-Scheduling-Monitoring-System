import { useState, useEffect } from "react";
import { ShieldCheck, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";
const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [active, setActive] = useState("home");
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      const sections = document.querySelectorAll("section[id]");
      let current = "";

      sections.forEach((s) => {
        if (window.scrollY >= s.offsetTop - 100) {
          current = s.id;
        }
      });

      if (current) setActive(current);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-[5%] h-[68px] transition-all duration-300 backdrop-blur-md border-b border-white/10 ${
        scrolled
          ? "bg-[#0F172A]/95 shadow-lg shadow-black/20"
          : "bg-[#0F172A]/90"
      }`}
    >
      {/* Logo */}
      <a
        href="#home"
        className="flex items-center gap-2 text-[1.35rem] font-extrabold tracking-tight text-white no-underline"
      >
        <span className="inline-block w-2 h-2 rounded-full bg-[#4ADE80]" />
        LightLearn
      </a>

      {/* Navigation Links */}
      <ul className="hidden md:flex items-center gap-9 list-none">
        {NAV_LINKS.map(({ label, href }) => (
          <li key={label}>
            <a
              href={href}
              className={`text-sm font-medium tracking-wide transition-colors duration-200 no-underline ${
                active === href.replace("#", "")
                  ? "text-white"
                  : "text-white/70 hover:text-white"
              }`}
            >
              {label}
            </a>
          </li>
        ))}
      </ul>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => navigate("/login")}
          className="flex items-center gap-2 px-4 py-2 rounded-md border border-[#4ADE80] text-[#4ADE80] font-semibold text-sm transition-all duration-200 hover:bg-[#4ADE80] hover:text-[#0F172A]"
        >
          <ShieldCheck size={16} />
          Admin
        </button>

        <button
          onClick={() => navigate("/student")}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#2563EB] border border-[#2563EB] text-white font-semibold text-sm transition-all duration-200 hover:bg-[#3B82F6] hover:border-[#3B82F6]"
        >
          <GraduationCap size={16} />
          Student Sign Up
        </button>
      </div>
    </nav>
  );
}