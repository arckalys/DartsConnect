"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Accueil", id: "home" },
    { href: "/tournois", label: "Tournois", id: "tournois" },
    { href: "/inscriptions", label: "Mes inscriptions", id: "inscriptions" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-10 h-[60px] bg-[rgba(10,10,10,0.95)] backdrop-blur-[12px] border-b border-[rgba(255,255,255,0.08)]">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-[10px] font-barlow-condensed font-extrabold text-[1.2rem] text-white no-underline">
        <div className="w-8 h-8 bg-[#e8220a] rounded-lg flex items-center justify-center text-[1rem] shadow-[0_0_12px_rgba(232,34,10,0.3)]">
          🎯
        </div>
        DartsConnect.FR
      </Link>

      {/* Navigation links */}
      <ul className="flex gap-1 list-none">
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
      <div className="flex items-center gap-3">
        <Link
          href="/tournois/creer"
          className="bg-[#e8220a] text-white font-semibold text-[0.88rem] px-[18px] py-2 rounded-lg transition-all duration-200 shadow-red-glow hover:bg-[#b81a08] no-underline"
        >
          + Cr&eacute;er un tournoi
        </Link>
        <Link
          href="/auth"
          className="w-[34px] h-[34px] rounded-full bg-[#181818] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[1rem] transition-colors duration-200 hover:border-[#e8220a] no-underline"
        >
          👤
        </Link>
      </div>
    </nav>
  );
}
