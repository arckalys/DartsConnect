export default function Footer() {
  return (
    <footer className="border-t border-[rgba(255,255,255,0.08)] px-4 sm:px-6 lg:px-10 py-6 sm:py-8 flex flex-col sm:flex-row items-center gap-4 sm:justify-between">
      <div className="font-barlow-condensed font-extrabold text-[1.1rem] text-[#777]">
        DartsConnect.FR
      </div>
      <ul className="flex gap-4 sm:gap-6 list-none flex-wrap justify-center">
        <li><a href="#" className="text-[0.82rem] text-[#777] no-underline hover:text-white">À propos</a></li>
        <li><a href="#" className="text-[0.82rem] text-[#777] no-underline hover:text-white">Contact</a></li>
        <li><a href="#" className="text-[0.82rem] text-[#777] no-underline hover:text-white">Mentions légales</a></li>
      </ul>
      <div className="text-[0.78rem] text-[#444]">© 2026 DartsConnect.FR</div>
    </footer>
  );
}
