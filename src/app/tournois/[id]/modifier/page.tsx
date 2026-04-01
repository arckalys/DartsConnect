"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import StepForm from "@/components/StepForm";
import { createClient } from "@/lib/supabase";
import { REGIONS } from "@/lib/types";

export const runtime = "edge";

const STEPS = [
  { label: "Étape 1/3", name: "Infos générales" },
  { label: "Étape 2/3", name: "Lieu et date" },
  { label: "Étape 3/3", name: "Contact" },
];

export default function ModifierTournoiPage() {
  const router = useRouter();
  const params = useParams();
  const tournoiId = params.id as string;
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Form fields
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [nbJoueurs, setNbJoueurs] = useState("");
  const [format, setFormat] = useState("");
  const [ville, setVille] = useState("");
  const [region, setRegion] = useState("");
  const [adresse, setAdresse] = useState("");
  const [dateTournoi, setDateTournoi] = useState("");
  const [heure, setHeure] = useState("10:00");
  const [contactNom, setContactNom] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactTel, setContactTel] = useState("");
  const [infosPratiques, setInfosPratiques] = useState("");

  // Load existing tournament data
  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/auth");
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("tournois")
        .select("*")
        .eq("id", tournoiId)
        .single();

      if (fetchError || !data) {
        setNotFound(true);
        setFetching(false);
        return;
      }

      // Verify ownership
      if (data.user_id !== session.user.id) {
        setNotFound(true);
        setFetching(false);
        return;
      }

      setNom(data.nom || "");
      setDescription(data.description || "");
      setNbJoueurs(String(data.nb_joueurs || ""));
      setFormat(data.format || "");
      setVille(data.ville || "");
      setRegion(data.region || "");
      setAdresse(data.adresse || "");
      setDateTournoi(data.date_tournoi || "");
      setHeure(data.heure || "10:00");
      setContactNom(data.contact_nom || "");
      setContactEmail(data.contact_email || "");
      setContactTel(data.contact_tel || "");
      setInfosPratiques(data.infos_pratiques || "");
      setFetching(false);
    }
    load();
  }, [tournoiId]); // eslint-disable-line react-hooks/exhaustive-deps

  function showError(msg: string) {
    setError(msg);
    setTimeout(() => setError(""), 4000);
  }

  function nextStep(current: number) {
    if (current === 1) {
      if (!nom.trim()) return showError("Le nom du tournoi est obligatoire.");
      if (!description.trim()) return showError("La description est obligatoire.");
      if (!nbJoueurs || parseInt(nbJoueurs) < 2) return showError("Le nombre de joueurs doit être au moins 2.");
      if (!format) return showError("Sélectionne un format de jeu.");
    }
    if (current === 2) {
      if (!ville.trim()) return showError("La ville est obligatoire.");
      if (!region) return showError("Sélectionne une région.");
      if (!dateTournoi) return showError("La date du tournoi est obligatoire.");
    }
    setError("");
    setStep(current + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function prevStep(current: number) {
    setStep(current - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function sauvegarder() {
    if (!contactNom.trim()) return showError("Le nom du contact est obligatoire.");
    if (!contactEmail.trim()) return showError("L'email de contact est obligatoire.");

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return showError("Tu dois être connecté pour modifier un tournoi.");
      }

      const updates = {
        nom: nom.trim(),
        description: description.trim(),
        nb_joueurs: parseInt(nbJoueurs),
        format,
        ville: ville.trim(),
        region,
        adresse: adresse.trim(),
        date_tournoi: dateTournoi,
        heure,
        contact_nom: contactNom.trim(),
        contact_email: contactEmail.trim(),
        contact_tel: contactTel.trim(),
        infos_pratiques: infosPratiques.trim(),
      };

      const { error: dbError } = await supabase
        .from("tournois")
        .update(updates)
        .eq("id", tournoiId);

      if (dbError) {
        setLoading(false);
        return showError("Erreur Supabase : " + dbError.message + (dbError.details ? " — " + dbError.details : "") + (dbError.hint ? " (Hint: " + dbError.hint + ")" : ""));
      }

      setSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur réseau inconnue";
      showError("Erreur réseau : " + message);
    } finally {
      setLoading(false);
    }
  }

  const recapFields = [
    { label: "Tournoi", value: nom },
    { label: "Format", value: format },
    { label: "Joueurs max", value: nbJoueurs },
    { label: "Ville", value: ville },
    { label: "Région", value: region },
    { label: "Date", value: dateTournoi ? new Date(dateTournoi).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—" },
    { label: "Heure", value: heure || "—" },
  ];

  if (fetching) {
    return (
      <div className="animate-page-in min-h-screen pt-[80px] px-4 sm:px-6 pb-12 max-w-[780px] mx-auto flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-[rgba(232,34,10,0.3)] border-t-[#e8220a] rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="animate-page-in min-h-screen pt-[80px] px-4 sm:px-6 pb-12 max-w-[780px] mx-auto flex flex-col items-center justify-center text-center">
        <div className="text-[3rem] mb-4 opacity-40">🚫</div>
        <div className="font-barlow-condensed font-black text-[1.6rem] uppercase mb-2">Tournoi introuvable</div>
        <div className="text-[0.88rem] text-[#777] mb-6">Ce tournoi n&apos;existe pas ou tu n&apos;as pas la permission de le modifier.</div>
        <button onClick={() => router.push("/tournois")} className="bg-[#e8220a] text-white border-none font-barlow-condensed font-bold text-[1rem] px-8 py-3 rounded-[10px] cursor-pointer transition-all shadow-red-glow-lg hover:bg-[#b81a08]">
          ← Retour aux tournois
        </button>
      </div>
    );
  }

  return (
    <div className="animate-page-in min-h-screen pt-[80px] px-4 sm:px-6 pb-12 max-w-[780px] mx-auto">
      {/* Header */}
      <div className="mb-8 sm:mb-10">
        <div className="font-barlow-condensed font-black text-[1.8rem] sm:text-[2.6rem] uppercase tracking-[0.5px]">
          Modifier le <span className="text-[#e8220a]">tournoi</span>
        </div>
        <div className="text-[0.9rem] text-[#777] mt-[6px]">
          Modifiez les informations de votre tournoi.
        </div>
      </div>

      {/* Stepper */}
      <StepForm steps={STEPS} currentStep={success ? 4 : step} />

      {/* Error message */}
      {error && (
        <div className="msg msg-error show">
          <span>⚠️</span><span>{error}</span>
        </div>
      )}

      {/* Success screen */}
      {success && (
        <div className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[18px] p-5 sm:p-8">
          <div className="text-center py-8 sm:py-12 px-2 sm:px-8">
            <div className="text-[4rem] mb-5 animate-pop">✅</div>
            <div className="font-barlow-condensed font-black text-[2rem] uppercase mb-2">Tournoi mis à jour !</div>
            <div className="text-[0.92rem] text-[#777] mb-8">Les modifications ont été enregistrées.</div>
            <div className="flex gap-3 justify-center flex-wrap">
              <button onClick={() => router.push("/tournois")} className="bg-[#e8220a] text-white border-none font-barlow-condensed font-bold text-[1rem] px-8 py-3 rounded-[10px] cursor-pointer transition-all shadow-red-glow-lg hover:bg-[#b81a08] flex items-center gap-2">
                Voir les tournois →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Infos générales */}
      {!success && step === 1 && (
        <>
          <div className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[18px] p-5 sm:p-8 mb-6 animate-fade-up">
            <div className="flex items-center gap-3 mb-7">
              <div className="w-10 h-10 bg-[rgba(232,34,10,0.12)] border border-[rgba(232,34,10,0.25)] rounded-[10px] flex items-center justify-center text-[1.2rem]">🎯</div>
              <h2 className="font-barlow-condensed font-extrabold text-[1.3rem] uppercase">Informations générales</h2>
            </div>
            <div className="mb-4">
              <label className="block text-[0.82rem] font-semibold text-[#ccc] mb-[6px]">Nom du tournoi *</label>
              <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex : Open de Paris — Fléchettes 2026" maxLength={80} />
              <div className="text-[0.75rem] text-[#777] text-right mt-1">{nom.length}/80</div>
            </div>
            <div className="mb-4">
              <label className="block text-[0.82rem] font-semibold text-[#ccc] mb-[6px]">Description *</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Décrivez votre tournoi..." maxLength={500} rows={4} />
              <div className="text-[0.75rem] text-[#777] text-right mt-1">{description.length}/500</div>
            </div>
            <div className="mb-4">
              <label className="block text-[0.82rem] font-semibold text-[#ccc] mb-[6px]">Nombre de joueurs max *</label>
              <input type="number" value={nbJoueurs} onChange={(e) => setNbJoueurs(e.target.value)} placeholder="Ex : 32" min={2} max={512} />
            </div>
            <div className="mb-4">
              <label className="block text-[0.82rem] font-semibold text-[#ccc] mb-[6px]">Format de jeu *</label>
              <select value={format} onChange={(e) => setFormat(e.target.value)}>
                <option value="">Sélectionner un format</option>
                <option value="Simple">Simple (1v1)</option>
                <option value="Doublette">Doublette (2v2)</option>
                <option value="Équipe">Équipe (4v4)</option>
                <option value="Mixte">Mixte</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <button onClick={() => router.push("/tournois")} className="bg-transparent text-[#777] border border-[rgba(255,255,255,0.08)] font-barlow-condensed font-bold text-[1rem] px-6 py-3 rounded-[10px] cursor-pointer transition-all hover:text-white hover:border-[rgba(255,255,255,0.2)]">
              ← Annuler
            </button>
            <button onClick={() => nextStep(1)} className="bg-[#e8220a] text-white border-none font-barlow-condensed font-bold text-[1rem] px-8 py-3 rounded-[10px] cursor-pointer transition-all shadow-red-glow-lg hover:bg-[#b81a08] flex items-center gap-2">
              Étape suivante →
            </button>
          </div>
        </>
      )}

      {/* Step 2: Lieu et date */}
      {!success && step === 2 && (
        <>
          <div className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[18px] p-5 sm:p-8 mb-6 animate-fade-up">
            <div className="flex items-center gap-3 mb-7">
              <div className="w-10 h-10 bg-[rgba(232,34,10,0.12)] border border-[rgba(232,34,10,0.25)] rounded-[10px] flex items-center justify-center text-[1.2rem]">📍</div>
              <h2 className="font-barlow-condensed font-extrabold text-[1.3rem] uppercase">Lieu et date</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-[0.82rem] font-semibold text-[#ccc] mb-[6px]">Ville *</label>
                <input type="text" value={ville} onChange={(e) => setVille(e.target.value)} placeholder="Paris" />
              </div>
              <div>
                <label className="block text-[0.82rem] font-semibold text-[#ccc] mb-[6px]">Région *</label>
                <select value={region} onChange={(e) => setRegion(e.target.value)}>
                  <option value="">Sélectionner</option>
                  {REGIONS.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-[0.82rem] font-semibold text-[#ccc] mb-[6px]">Adresse complète</label>
              <input type="text" value={adresse} onChange={(e) => setAdresse(e.target.value)} placeholder="Ex : Salle des sports, 12 rue de la Paix" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-[0.82rem] font-semibold text-[#ccc] mb-[6px]">Date du tournoi *</label>
                <input type="date" value={dateTournoi} onChange={(e) => setDateTournoi(e.target.value)} />
              </div>
              <div>
                <label className="block text-[0.82rem] font-semibold text-[#ccc] mb-[6px]">Heure de début</label>
                <input type="time" value={heure} onChange={(e) => setHeure(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <button onClick={() => prevStep(2)} className="bg-transparent text-[#777] border border-[rgba(255,255,255,0.08)] font-barlow-condensed font-bold text-[1rem] px-6 py-3 rounded-[10px] cursor-pointer transition-all hover:text-white hover:border-[rgba(255,255,255,0.2)]">
              ← Retour
            </button>
            <button onClick={() => nextStep(2)} className="bg-[#e8220a] text-white border-none font-barlow-condensed font-bold text-[1rem] px-8 py-3 rounded-[10px] cursor-pointer transition-all shadow-red-glow-lg hover:bg-[#b81a08] flex items-center gap-2">
              Étape suivante →
            </button>
          </div>
        </>
      )}

      {/* Step 3: Contact + Recap */}
      {!success && step === 3 && (
        <>
          <div className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[18px] p-5 sm:p-8 mb-6 animate-fade-up">
            <div className="flex items-center gap-3 mb-7">
              <div className="w-10 h-10 bg-[rgba(232,34,10,0.12)] border border-[rgba(232,34,10,0.25)] rounded-[10px] flex items-center justify-center text-[1.2rem]">📞</div>
              <h2 className="font-barlow-condensed font-extrabold text-[1.3rem] uppercase">Contact et infos pratiques</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-[0.82rem] font-semibold text-[#ccc] mb-[6px]">Nom du contact *</label>
                <input type="text" value={contactNom} onChange={(e) => setContactNom(e.target.value)} placeholder="Jean Dupont" />
              </div>
              <div>
                <label className="block text-[0.82rem] font-semibold text-[#ccc] mb-[6px]">Email de contact *</label>
                <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="contact@tournoi.fr" />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-[0.82rem] font-semibold text-[#ccc] mb-[6px]">Téléphone</label>
              <input type="tel" value={contactTel} onChange={(e) => setContactTel(e.target.value)} placeholder="06 00 00 00 00" />
            </div>
            <div className="mb-4">
              <label className="block text-[0.82rem] font-semibold text-[#ccc] mb-[6px]">Informations pratiques</label>
              <textarea value={infosPratiques} onChange={(e) => setInfosPratiques(e.target.value)} placeholder="Parking, restauration sur place, règles d'inscription, tarif d'entrée..." rows={4} />
            </div>
          </div>

          {/* Recap */}
          <div className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[18px] p-5 sm:p-8 mb-6 animate-fade-up">
            <div className="flex items-center gap-3 mb-7">
              <div className="w-10 h-10 bg-[rgba(232,34,10,0.12)] border border-[rgba(232,34,10,0.25)] rounded-[10px] flex items-center justify-center text-[1.2rem]">📋</div>
              <h2 className="font-barlow-condensed font-extrabold text-[1.3rem] uppercase">Récapitulatif</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {recapFields.map((f) => (
                <div key={f.label} className="bg-[#111] border border-[rgba(255,255,255,0.08)] rounded-[10px] p-3">
                  <div className="text-[0.72rem] font-bold uppercase tracking-[1px] text-[#777] mb-1">{f.label}</div>
                  <div className="text-[0.92rem] text-white font-medium">{f.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <button onClick={() => prevStep(3)} className="bg-transparent text-[#777] border border-[rgba(255,255,255,0.08)] font-barlow-condensed font-bold text-[1rem] px-6 py-3 rounded-[10px] cursor-pointer transition-all hover:text-white hover:border-[rgba(255,255,255,0.2)]">
              ← Retour
            </button>
            <button onClick={sauvegarder} disabled={loading} className="bg-[#e8220a] text-white border-none font-barlow-condensed font-bold text-[1rem] px-8 py-3 rounded-[10px] cursor-pointer transition-all shadow-red-glow-lg hover:bg-[#b81a08] flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? <div className="spinner" /> : "✅ Sauvegarder les modifications"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
