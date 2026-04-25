"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, X, Check, ChevronDown, ChevronUp } from "lucide-react";

const STORAGE_KEY = "dt-cookie-consent";

type Consent = "accepted" | "refused" | null;

export default function CookieBanner() {
  const [consent, setConsent] = useState<Consent>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY) as Consent;
    setConsent(stored);
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setConsent("accepted");
  }

  function refuse() {
    localStorage.setItem(STORAGE_KEY, "refused");
    setConsent("refused");
  }

  // Expose reset for the footer "Gérer" link
  useEffect(() => {
    (window as Window & { resetCookieConsent?: () => void }).resetCookieConsent = () => {
      localStorage.removeItem(STORAGE_KEY);
      setConsent(null);
      setShowDetails(false);
    };
    return () => {
      delete (window as Window & { resetCookieConsent?: () => void }).resetCookieConsent;
    };
  }, []);

  if (!mounted || consent !== null) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] p-3 sm:p-4 flex justify-center pointer-events-none">
      <div
        className="pointer-events-auto w-full max-w-[680px] bg-[#141414] border border-[rgba(255,255,255,0.12)] rounded-[14px] shadow-[0_-4px_40px_rgba(0,0,0,0.6)] overflow-hidden animate-fade-up"
      >
        {/* Header */}
        <div className="flex items-start gap-3 p-4 sm:p-5">
          <div className="shrink-0 w-9 h-9 bg-[rgba(232,34,10,0.12)] border border-[rgba(232,34,10,0.3)] rounded-[10px] flex items-center justify-center mt-[2px]">
            <Cookie className="w-[18px] h-[18px] text-[#e8220a]" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="font-barlow-condensed font-extrabold text-[1.05rem] uppercase tracking-[0.3px] mb-1">
              Ce site utilise des cookies
            </div>
            <p className="text-[0.82rem] text-[#aaa] leading-[1.6]">
              Nous utilisons des cookies de session strictement nécessaires pour l&apos;authentification et le bon fonctionnement du site. Aucun cookie publicitaire ou de traçage n&apos;est utilisé.{" "}
              <Link href="/confidentialite" className="text-[#e8220a] no-underline hover:underline">
                En savoir plus
              </Link>
            </p>

            {/* Details toggle */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="inline-flex items-center gap-1 mt-2 text-[0.78rem] text-[#666] hover:text-[#aaa] transition-colors bg-transparent border-none cursor-pointer p-0"
            >
              {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              Détail des cookies
            </button>
          </div>
        </div>

        {/* Details panel */}
        {showDetails && (
          <div className="mx-4 sm:mx-5 mb-3 bg-[#0d0d0d] border border-[rgba(255,255,255,0.06)] rounded-[10px] p-3 text-[0.78rem] text-[#888] leading-[1.7]">
            <div className="flex items-start gap-2 mb-2">
              <span className="inline-block mt-[4px] w-2 h-2 rounded-full bg-[#22c55e] shrink-0" />
              <div>
                <span className="text-white font-semibold">Cookies de session (Supabase Auth)</span>
                <span className="text-[#666]"> — Strictement nécessaires</span>
                <div>Permettent de maintenir ta connexion entre les pages. Expiration : durée de la session.</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="inline-block mt-[4px] w-2 h-2 rounded-full bg-[#555] shrink-0" />
              <div>
                <span className="text-white font-semibold">Cookies analytics / publicitaires</span>
                <span className="text-[#666]"> — Non utilisés</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col xs:flex-row gap-2 px-4 sm:px-5 pb-4 sm:pb-5">
          <button
            onClick={accept}
            className="flex-1 flex items-center justify-center gap-2 py-[10px] px-4 bg-[#e8220a] text-white font-barlow-condensed font-bold text-[0.95rem] rounded-[9px] border-none cursor-pointer transition-all hover:bg-[#b81a08] shadow-red-glow"
          >
            <Check className="w-4 h-4" />
            Accepter
          </button>
          <button
            onClick={refuse}
            className="flex-1 flex items-center justify-center gap-2 py-[10px] px-4 bg-transparent text-[#aaa] font-barlow-condensed font-bold text-[0.95rem] rounded-[9px] border border-[rgba(255,255,255,0.1)] cursor-pointer transition-all hover:border-[rgba(255,255,255,0.25)] hover:text-white"
          >
            <X className="w-4 h-4" />
            Continuer sans accepter
          </button>
        </div>
      </div>
    </div>
  );
}
