"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: "/", label: "Accueil", id: "home" },
    { href: "/tournois", label: "Tournois", id: "tournois" },
    { href: "/inscriptions", label: "Mes inscriptions", id: "inscriptions" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] bg-[rgba(10,10,10,0.95)] backdrop-blur-[12px] border-b border-[rgba(255,255,255,0.08)]">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-10 h-[60px]">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-[10px] font-barlow-condensed font-extrabold text-[1.2rem] text-white no-underline">
          <div className="w-8 h-8 bg-[#e8220a] rounded-lg flex items-center justify-center text-[1rem] shadow-[0_0_12px_rgba(232,34,10,0.3)]">
            🎯
          </div>
          <span className="hidden sm:inline">DartsConnect.FR</span>
        </Link>

        {/* Desktop navigation links */}
        <ul className="hidden lg:flex gap-1 list-none">
          {links.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <li key={link.id}>
                <Link
                  href={link.href}
                  className={`no-underline text-[0.88rem] font-medium px-[14px] py-[6px] rounded-md transition-all duration-200 ${
                    isActive
                      ? "text-white border border-[rgba(232,34,10,0.4)] bg-[rgba(232,34,10,0.08)]"
                      : "text-[#777] hover:text-white hover:bg-[rgba(255,255,255,0.06)]"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/tournois/creer"
            className="hidden sm:inline-block bg-[#e8220a] text-white font-semibold text-[0.88rem] px-[18px] py-2 rounded-lg transition-all duration-200 shadow-red-glow hover:bg-[#b81a08] no-underline"
          >
            + Cr&eacute;er un tournoi
          </Link>
          <Link
            href="/auth"
            className="w-[34px] h-[34px] rounded-full bg-[#181818] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[1rem] transition-colors duration-200 hover:border-[#e8220a] no-underline"
          >
            👤
          </Link>

          {/* Hamburger button - mobile/tablet */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden w-[34px] h-[34px] rounded-lg bg-[#181818] border border-[rgba(255,255,255,0.08)] flex items-center justify-center cursor-pointer transition-colors hover:border-[#e8220a]"
            aria-label="Menu"
          >
            {menuOpen ? (
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden border-t border-[rgba(255,255,255,0.08)] bg-[rgba(10,10,10,0.98)] backdrop-blur-[12px] px-4 py-3 flex flex-col gap-1">
          {links.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.id}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`no-underline text-[0.95rem] font-medium px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? "text-white bg-[rgba(232,34,10,0.1)] border border-[rgba(232,34,10,0.3)]"
                    : "text-[#aaa] hover:text-white hover:bg-[rgba(255,255,255,0.06)] border border-transparent"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/tournois/creer"
            onClick={() => setMenuOpen(false)}
            className="sm:hidden text-center bg-[#e8220a] text-white font-semibold text-[0.95rem] px-4 py-3 rounded-lg no-underline mt-1"
          >
            + Cr&eacute;er un tournoi
          </Link>
        </div>
      )}
    </nav>
  );
}
