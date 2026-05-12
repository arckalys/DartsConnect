"use client";

import { useState, useEffect } from "react";
import { Users, X, Plus, Trash2 } from "lucide-react";
import { defaultCoequipiersCount, TeamInfo } from "@/lib/types";

interface Props {
  open: boolean;
  format: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (data: TeamInfo) => void;
}

export default function TeamRegistrationModal({ open, format, loading, onClose, onConfirm }: Props) {
  const initialCount = Math.max(defaultCoequipiersCount(format), 1);
  const [nomEquipe, setNomEquipe] = useState("");
  const [coequipiers, setCoequipiers] = useState<string[]>(() => Array(initialCount).fill(""));
  const [error, setError] = useState("");

  // Reset à l'ouverture
  useEffect(() => {
    if (open) {
      setNomEquipe("");
      setCoequipiers(Array(Math.max(defaultCoequipiersCount(format), 1)).fill(""));
      setError("");
    }
  }, [open, format]);

  if (!open) return null;

  const isEquipe = format === "Équipe";
  const minCoequipiers = defaultCoequipiersCount(format);

  function updateCoequipier(idx: number, value: string) {
    setCoequipiers((prev) => prev.map((v, i) => (i === idx ? value : v)));
  }

  function addCoequipier() {
    setCoequipiers((prev) => [...prev, ""]);
  }

  function removeCoequipier(idx: number) {
    setCoequipiers((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSubmit() {
    const cleanedNom = nomEquipe.trim();
    const cleanedList = coequipiers.map((c) => c.trim()).filter((c) => c.length > 0);
    const allFilled = coequipiers.length >= minCoequipiers && coequipiers.every((c) => c.trim().length > 0);

    // Au moins l'un des deux : nom d'équipe OU tous les coéquipiers renseignés
    if (!cleanedNom && !allFilled) {
      setError(
        `Renseigne soit le nom de l'équipe, soit le prénom de ${
          minCoequipiers > 1 ? "tous les coéquipiers" : "ton coéquipier"
        }.`
      );
      return;
    }

    onConfirm({
      nom_equipe: cleanedNom || null,
      coequipiers: cleanedList.length > 0 ? cleanedList : null,
    });
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(0,0,0,0.7)] backdrop-blur-sm p-3 xs:p-4">
      <div className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[14px] xs:rounded-[18px] p-5 xs:p-6 sm:p-8 max-w-[480px] w-full animate-fade-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[rgba(232,34,10,0.12)] border border-[rgba(232,34,10,0.25)] rounded-[10px] flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-[#b91c0a]" />
            </div>
            <div>
              <div className="font-barlow-condensed font-black text-[1.3rem] uppercase leading-tight">
                Inscription {format}
              </div>
              <div className="text-[0.78rem] text-[#777]">
                Nom d&apos;équipe <span className="text-[#b91c0a] font-bold">ou</span> prénoms des coéquipiers
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-[#777] hover:text-white p-1 -m-1 cursor-pointer disabled:opacity-50"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nom d'équipe */}
        <div className="mb-5">
          <label className="block text-[0.78rem] font-bold uppercase tracking-[1px] text-[#777] mb-2">
            Nom de l&apos;équipe <span className="text-[#555] normal-case font-medium tracking-normal">(prioritaire)</span>
          </label>
          <input
            type="text"
            value={nomEquipe}
            onChange={(e) => setNomEquipe(e.target.value)}
            placeholder="Ex : Les Flèches d'Or"
            maxLength={60}
            disabled={loading}
            className="w-full bg-[#0a0a0a] border border-[rgba(255,255,255,0.08)] rounded-[10px] px-3 py-2.5 text-[0.92rem] text-white placeholder:text-[#555] focus:outline-none focus:border-[rgba(232,34,10,0.4)]"
          />
        </div>

        {/* Séparateur OU */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-[rgba(255,255,255,0.08)]" />
          <div className="text-[0.72rem] font-bold uppercase tracking-[1px] text-[#555]">ou</div>
          <div className="flex-1 h-px bg-[rgba(255,255,255,0.08)]" />
        </div>

        {/* Coéquipiers */}
        <div className="mb-5">
          <label className="block text-[0.78rem] font-bold uppercase tracking-[1px] text-[#777] mb-2">
            Prénom{coequipiers.length > 1 ? "s" : ""} {coequipiers.length > 1 ? "des coéquipiers" : "du coéquipier"}
          </label>
          <div className="flex flex-col gap-2">
            {coequipiers.map((val, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={val}
                  onChange={(e) => updateCoequipier(idx, e.target.value)}
                  placeholder={`Coéquipier ${idx + 1}`}
                  maxLength={40}
                  disabled={loading}
                  className="flex-1 bg-[#0a0a0a] border border-[rgba(255,255,255,0.08)] rounded-[10px] px-3 py-2.5 text-[0.92rem] text-white placeholder:text-[#555] focus:outline-none focus:border-[rgba(232,34,10,0.4)]"
                />
                {coequipiers.length > minCoequipiers && (
                  <button
                    onClick={() => removeCoequipier(idx)}
                    disabled={loading}
                    className="text-[#f87171] p-2 rounded-lg hover:bg-[rgba(248,113,113,0.1)] cursor-pointer disabled:opacity-50"
                    aria-label="Retirer ce coéquipier"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {isEquipe && (
            <button
              onClick={addCoequipier}
              disabled={loading || coequipiers.length >= 8}
              className="mt-2 inline-flex items-center gap-1.5 text-[0.82rem] font-bold text-[#b91c0a] hover:text-[#f87171] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Ajouter un coéquipier
            </button>
          )}
        </div>

        {/* Erreur */}
        {error && (
          <div className="bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.25)] text-[#f87171] rounded-[10px] px-3 py-2 text-[0.82rem] mb-4">
            {error}
          </div>
        )}

        {/* Boutons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 rounded-[10px] font-barlow-condensed font-bold text-[0.95rem] cursor-pointer bg-transparent text-white border border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.05)] disabled:opacity-60"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3 rounded-[10px] font-barlow-condensed font-bold text-[0.95rem] cursor-pointer border-none bg-[#b91c0a] text-white shadow-red-glow-lg hover:bg-[#b81a08] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Confirmer"}
          </button>
        </div>
      </div>
    </div>
  );
}
