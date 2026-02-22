"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";

const links = [
  { label: "Comment ça marche", href: "#process" },
  { label: "Tarifs", href: "#pricing" },
  { label: "FAQ", href: "#faq" }
];

export function Navbar() {
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    setScrolled(latest > 50);
    if (latest > previous && latest > 80) {
      setHidden(true);
      setOpen(false);
    } else {
      setHidden(false);
    }
  });

  const navClasses = `fixed inset-x-0 top-0 z-50 border-b backdrop-blur-sm transition duration-200 ${
    scrolled ? "border-[#E2E8F0] bg-white/95 shadow-[0_2px_16px_rgba(0,0,0,0.06)]" : "border-transparent bg-white/95"
  }`;

  return (
    <motion.nav initial={{ y: 0 }} animate={{ y: hidden ? -80 : 0 }} transition={{ duration: 0.3 }} className={navClasses}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a href="#hero" className="text-lg font-semibold text-night">
          Agentable<span className="text-accent">.</span>
        </a>
        <div className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="text-sm font-medium text-slate transition hover:text-accent">
              {link.label}
            </a>
          ))}
          <a
            href="#audit"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(99,102,241,0.3)] transition hover:bg-[#4F46E5]"
          >
            Audit gratuit
          </a>
        </div>
        <button className="md:hidden" onClick={() => setOpen((prev) => !prev)} aria-label="Ouvrir le menu">
          {open ? <X className="h-6 w-6 text-night" /> : <Menu className="h-6 w-6 text-night" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border/70 bg-white px-6 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {links.map((link) => (
              <a key={link.href} href={link.href} className="text-base font-medium text-night" onClick={() => setOpen(false)}>
                {link.label}
              </a>
            ))}
            <a
              href="#audit"
              className="rounded-lg bg-accent px-4 py-3 text-center text-sm font-semibold text-white"
              onClick={() => setOpen(false)}
            >
              Audit gratuit
            </a>
          </div>
        </div>
      )}
    </motion.nav>
  );
}
