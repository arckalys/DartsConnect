"use client";

import { useState } from "react";
import { Send, CheckCircle } from "lucide-react";
import Footer from "@/components/Footer";

export const runtime = "edge";

const SUJETS = [
  "Question générale",
  "Problème technique",
  "Signaler un abus",
  "Partenariat",
  "Autre",
];

export default function ContactPage() {
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [sujet, setSujet] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !sujet || !message) return;
    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prenom, nom, email, sujet, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setSending(false);
    }
  }

  const inputClass =
    "w-full bg-[#0a0a0a] border border-[rgba(255,255,255,0.12)] rounded-[10px] px-4 py-3 text-[0.9rem] text-white placeholder-[#555] outline-none transition-all focus:border-[#b91c0a] focus:shadow-[0_0_0_3px_rgba(232,34,10,0.15)]";

  return (
    <div className="animate-page-in min-h-screen flex flex-col">
      <div className="flex-1 pt-[72px] xs:pt-[80px] px-3 xs:px-4 sm:px-6 pb-10 sm:pb-16">
        <div className="max-w-[600px] mx-auto">

          {/* Header */}
          <div className="text-center mb-8 sm:mb-10 pt-6 sm:pt-10">
            <h1 className="font-barlow-condensed font-black text-[1.8rem] xs:text-[2.2rem] sm:text-[3rem] uppercase leading-[1.1] mb-3">
              Nous <span className="text-[#b91c0a]">contacter</span>
            </h1>
            <p className="text-[0.9rem] sm:text-[0.95rem] text-[#999] leading-[1.6]">
              Une question, un problème ou une idée ? Écrivez-nous.
            </p>
          </div>

          {sent ? (
            <div className="bg-[#141414] border border-[rgba(34,197,94,0.25)] rounded-[14px] p-8 sm:p-10 text-center">
              <CheckCircle className="w-12 h-12 text-[#22c55e] mx-auto mb-4" />
              <div className="font-barlow-condensed font-black text-[1.4rem] uppercase mb-2">Message envoyé !</div>
              <p className="text-[0.9rem] text-[#999] leading-[1.6]">
                Merci pour votre message. Nous vous répondrons dans les plus brefs délais.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[14px] p-5 sm:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[0.78rem] font-bold uppercase tracking-[1px] text-[#777] mb-2">Prénom</label>
                  <input
                    type="text"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    placeholder="Votre prénom"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-[0.78rem] font-bold uppercase tracking-[1px] text-[#777] mb-2">Nom</label>
                  <input
                    type="text"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="Votre nom"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-[0.78rem] font-bold uppercase tracking-[1px] text-[#777] mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className={inputClass}
                />
              </div>

              <div className="mb-4">
                <label className="block text-[0.78rem] font-bold uppercase tracking-[1px] text-[#777] mb-2">Sujet *</label>
                <select
                  required
                  value={sujet}
                  onChange={(e) => setSujet(e.target.value)}
                  className={`${inputClass} ${!sujet ? "text-[#555]" : ""}`}
                >
                  <option value="" disabled>Choisir un sujet</option>
                  {SUJETS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-[0.78rem] font-bold uppercase tracking-[1px] text-[#777] mb-2">Message *</label>
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Votre message..."
                  className={`${inputClass} resize-y min-h-[120px]`}
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.25)] rounded-[10px] text-[0.85rem] text-[#f87171]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={sending}
                className="w-full py-[13px] rounded-[10px] font-barlow-condensed font-bold text-[1.05rem] cursor-pointer border-none bg-[#b91c0a] text-white shadow-red-glow-lg hover:bg-[#b81a08] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Envoyer
                  </>
                )}
              </button>
            </form>
          )}

        </div>
      </div>
      <Footer />
    </div>
  );
}
