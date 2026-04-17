import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[rgba(255,255,255,0.08)] px-3 xs:px-4 sm:px-6 lg:px-10 xl:px-16 py-5 sm:py-8 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 sm:justify-between">
      <div className="font-barlow-condensed font-extrabold text-[0.95rem] xs:text-[1rem] sm:text-[1.1rem] xl:text-[1.2rem] text-[#777]">
        DartsTournois
      </div>
      <ul className="flex gap-3 xs:gap-4 sm:gap-6 list-none flex-wrap justify-center">
        <li><Link href="/a-propos" className="text-[0.78rem] xs:text-[0.8rem] sm:text-[0.82rem] text-[#777] no-underline hover:text-white transition-colors">À propos</Link></li>
        <li><Link href="/contact" className="text-[0.78rem] xs:text-[0.8rem] sm:text-[0.82rem] text-[#777] no-underline hover:text-white transition-colors">Contact</Link></li>
        <li><Link href="/mentions-legales" className="text-[0.78rem] xs:text-[0.8rem] sm:text-[0.82rem] text-[#777] no-underline hover:text-white transition-colors">Mentions légales</Link></li>
        <li><Link href="/confidentialite" className="text-[0.78rem] xs:text-[0.8rem] sm:text-[0.82rem] text-[#777] no-underline hover:text-white transition-colors">Confidentialité</Link></li>
      </ul>
      <div className="text-[0.75rem] xs:text-[0.78rem] text-[#444]">© 2026 DartsTournois</div>
    </footer>
  );
}
