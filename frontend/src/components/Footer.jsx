import { motion } from "framer-motion";
import { Globe, AtSign, Link2 } from "lucide-react";
import { usePermissions } from "../auth/PermissionsContext";
import { fadeUp } from "./landingConstants";
import logo from "../assets/logoll.png";

const LINK_GROUPS = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#demo" },
      { label: "About", href: "#about" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About us", href: "#about" },
      { label: "Contact", href: "#contact" },
      { label: "Register institution", href: "/register-institution" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy policy", href: "#" },
      { label: "Terms of service", href: "#" },
    ],
  },
];

const SOCIALS = [
  { icon: Globe, href: "#", label: "Website" },
  { icon: AtSign, href: "#", label: "Email" },
  { icon: Link2, href: "#", label: "LinkedIn" },
];

export default function Footer() {
  const { platformInfo } = usePermissions();
  const socials = SOCIALS.map((s) =>
    s.label === 'Email' && platformInfo?.support_email
      ? { ...s, href: `mailto:${platformInfo.support_email}` }
      : s
  );

  return (
    <footer className="relative px-[5%] pt-16 pb-8 bg-ink overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-ocean-500/50 to-transparent" />
      {/* ambient ocean glow, solid tint only — matches the rest of the page */}
      <div aria-hidden="true" className="absolute -top-40 left-1/2 -translate-x-1/2 w-[560px] h-[280px] rounded-full bg-ocean-600/10 blur-3xl pointer-events-none" />

      <div className="relative max-w-[1100px] mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            variants={fadeUp}
            custom={0}
            className="col-span-2 sm:col-span-1"
          >
            <a href="#home" className="flex items-center gap-2 no-underline mb-3">
              <img src={logo} alt="LightLearn" className="w-8 h-8 rounded-xl object-cover shadow-ocean-glow" />
              <span className="font-display font-bold text-[1.05rem] text-white">LightLearn</span>
            </a>
            <p className="text-white/70 text-[0.82rem] leading-relaxed max-w-[220px] mb-5">
              One live calendar and workspace for the whole academic term.
            </p>
            <div className="flex gap-3">
              {socials.map(({ icon: Icon, href, label }) => (
                <motion.a
                  key={label}
                  href={href}
                  aria-label={label}
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.15 }}
                  className="w-8 h-8 bg-white/[0.06] border border-white/10 rounded-xl flex items-center justify-center text-white/70 hover:text-ocean-300 hover:border-ocean-500/40 hover:bg-white/10 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-400/50"
                >
                  <Icon size={14} />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {LINK_GROUPS.map((group, i) => (
            <motion.div
              key={group.heading}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-40px" }}
              variants={fadeUp}
              custom={i + 1}
            >
              <p className="text-white text-xs font-semibold tracking-wide uppercase mb-4">{group.heading}</p>
              <ul className="flex flex-col gap-3 list-none">
                {group.links.map(({ label, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      className="text-white/70 text-[0.85rem] no-underline transition-colors duration-200 hover:text-ocean-300 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-400/50"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={4}
          className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-6"
        >
          <p className="text-white/60 text-[0.78rem]">© {new Date().getFullYear()} LightLearn. All rights reserved.</p>
          <p className="text-white/60 text-[0.78rem]">Built for the full academic term.</p>
        </motion.div>
      </div>
    </footer>
  );
}
