"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { MessageSquare, Plus, X, AlertTriangle, Check, ChevronRight, User as UserIcon, Search } from "lucide-react";
import { createClient } from "@/lib/supabase";
import Footer from "@/components/Footer";
import type { User } from "@supabase/supabase-js";

export const runtime = "edge";

interface Question {
  id: number;
  user_id: string;
  titre: string;
  contenu: string;
  created_at: string;
  profiles: { pseudo: string | null; avatar_url: string | null } | null;
  forum_reponses: { id: number }[];
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  if (h < 24) return `il y a ${h}h`;
  if (d < 30) return `il y a ${d}j`;
  return new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export default function ForumPage() {
  const supabase = createClient();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [search, setSearch] = useState("");

  // Formulaire nouvelle question
  const [formOpen, setFormOpen] = useState(false);
  const [titre, setTitre] = useState("");
  const [contenu, setContenu] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    fetchQuestions();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchQuestions() {
    setLoading(true);
    const { data } = await supabase
      .from("forum_questions")
      .select("id, user_id, titre, contenu, created_at, profiles(pseudo, avatar_url), forum_reponses(id)")
      .order("created_at", { ascending: false });
    setQuestions((data as unknown as Question[]) ?? []);
    setLoading(false);
  }

  async function postQuestion() {
    if (!titre.trim()) return setError("Le titre est obligatoire.");
    if (!contenu.trim()) return setError("La description est obligatoire.");
    if (!user) return setError("Tu dois être connecté.");
    setPosting(true);
    setError("");
    const { error: err } = await supabase
      .from("forum_questions")
      .insert({ user_id: user.id, titre: titre.trim(), contenu: contenu.trim() });
    setPosting(false);
    if (err) return setError(err.message);
    setTitre("");
    setContenu("");
    setFormOpen(false);
    setSuccessMsg("Question publiée !");
    setTimeout(() => setSuccessMsg(""), 3000);
    fetchQuestions();
  }

  const filtered = questions.filter((q) =>
    search === "" ||
    q.titre.toLowerCase().includes(search.toLowerCase()) ||
    q.contenu.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-page-in min-h-screen flex flex-col">
      <div className="flex-1 pt-[72px] xs:pt-[80px] px-3 xs:px-4 sm:px-6 lg:px-10 pb-12">
        <div className="max-w-[820px] mx-auto">

          {/* Header */}
          <div className="flex items-start justify-between gap-4 mt-6 mb-8">
            <div>
              <h1 className="font-barlow-condensed font-black text-[1.8rem] xs:text-[2.2rem] sm:text-[2.6rem] uppercase leading-[1.1]">
                Forum <span className="text-[#e8220a]">Communauté</span>
              </h1>
              <p className="text-[0.88rem] text-[#777] mt-[6px]">Pose tes questions, partage ton expérience</p>
            </div>
            {user ? (
              <button
                onClick={() => setFormOpen(!formOpen)}
                className="flex-shrink-0 flex items-center gap-2 bg-[#e8220a] text-white font-barlow-condensed font-bold text-[0.9rem] sm:text-[1rem] px-4 sm:px-5 py-[10px] sm:py-[11px] rounded-[10px] border-none cursor-pointer transition-all shadow-red-glow-lg hover:bg-[#b81a08]"
              >
                {formOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                <span className="hidden xs:inline">{formOpen ? "Annuler" : "Poser une question"}</span>
              </button>
            ) : (
              <Link
                href="/auth"
                className="flex-shrink-0 flex items-center gap-2 bg-[#141414] border border-[rgba(255,255,255,0.08)] text-[#ccc] font-barlow-condensed font-bold text-[0.9rem] sm:text-[1rem] px-4 sm:px-5 py-[10px] sm:py-[11px] rounded-[10px] no-underline transition-all hover:border-[#e8220a] hover:text-white"
              >
                Connexion pour participer
              </Link>
            )}
          </div>

          {/* Messages */}
          {error && (
            <div className="msg msg-error show mb-4">
              <AlertTriangle className="w-4 h-4 shrink-0" /><span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="msg msg-success show mb-4">
              <Check className="w-4 h-4 shrink-0" /><span>{successMsg}</span>
            </div>
          )}

          {/* Formulaire nouvelle question */}
          {formOpen && (
            <div className="bg-[#141414] border border-[rgba(232,34,10,0.3)] rounded-[16px] p-5 sm:p-6 mb-6 animate-fade-up">
              <div className="font-barlow-condensed font-extrabold text-[1.1rem] uppercase tracking-[0.5px] mb-4 text-[#e8220a]">
                Nouvelle question
              </div>
              <div className="mb-4">
                <label className="block text-[0.82rem] font-semibold text-[#ccc] mb-[6px]">Titre *</label>
                <input
                  type="text"
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  placeholder="Ex : Comment s'inscrire à un tournoi en doublette ?"
                  maxLength={120}
                />
                <div className="text-right text-[0.72rem] text-[#555] mt-1">{titre.length}/120</div>
              </div>
              <div className="mb-5">
                <label className="block text-[0.82rem] font-semibold text-[#ccc] mb-[6px]">Description *</label>
                <textarea
                  value={contenu}
                  onChange={(e) => setContenu(e.target.value)}
                  placeholder="Décris ta question en détail..."
                  maxLength={2000}
                  rows={4}
                />
                <div className="text-right text-[0.72rem] text-[#555] mt-1">{contenu.length}/2000</div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={postQuestion}
                  disabled={posting}
                  className="flex-1 py-[12px] rounded-[10px] font-barlow-condensed font-bold text-[1rem] cursor-pointer border-none bg-[#e8220a] text-white hover:bg-[#b81a08] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {posting ? <div className="spinner" /> : "Publier la question"}
                </button>
                <button
                  onClick={() => { setFormOpen(false); setTitre(""); setContenu(""); setError(""); }}
                  className="px-5 py-[12px] rounded-[10px] font-barlow-condensed font-bold text-[0.9rem] cursor-pointer bg-transparent text-[#777] border border-[rgba(255,255,255,0.08)] hover:text-white"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Barre de recherche */}
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher dans le forum..."
              className="!pl-9"
            />
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 mb-5 text-[0.82rem] text-[#555]">
            <span><strong className="text-white">{questions.length}</strong> question{questions.length !== 1 ? "s" : ""}</span>
            {search && <span>· <strong className="text-white">{filtered.length}</strong> résultat{filtered.length !== 1 ? "s" : ""}</span>}
          </div>

          {/* Liste des questions */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-[3px] border-[rgba(232,34,10,0.3)] border-t-[#e8220a] rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-[#555]">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <div className="font-barlow-condensed font-bold text-[1.3rem] text-[#444] mb-2">
                {search ? "Aucun résultat" : "Aucune question pour le moment"}
              </div>
              <div className="text-[0.86rem]">
                {search ? "Essaie avec d'autres mots-clés" : "Sois le premier à poser une question !"}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((q) => {
                const pseudo = q.profiles?.pseudo || "Joueur";
                const avatar = q.profiles?.avatar_url;
                const nbReponses = q.forum_reponses?.length ?? 0;
                const excerpt = q.contenu.length > 140 ? q.contenu.substring(0, 140) + "…" : q.contenu;

                return (
                  <Link
                    key={q.id}
                    href={`/forum/${q.id}`}
                    className="group bg-[#141414] border border-[rgba(255,255,255,0.07)] rounded-[14px] p-4 sm:p-5 no-underline text-white transition-all duration-200 hover:border-[rgba(232,34,10,0.3)] hover:bg-[rgba(232,34,10,0.03)] flex gap-4 items-start"
                  >
                    {/* Badge réponses */}
                    <div className={`flex-shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-[10px] text-center ${nbReponses > 0 ? "bg-[rgba(232,34,10,0.1)] border border-[rgba(232,34,10,0.25)]" : "bg-[#111] border border-[rgba(255,255,255,0.07)]"}`}>
                      <div className={`font-barlow-condensed font-black text-[1.2rem] leading-none ${nbReponses > 0 ? "text-[#e8220a]" : "text-[#444]"}`}>
                        {nbReponses}
                      </div>
                      <div className="text-[0.6rem] text-[#555] mt-[1px]">rép.</div>
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="font-barlow-condensed font-extrabold text-[1rem] sm:text-[1.1rem] uppercase tracking-[0.3px] mb-[5px] group-hover:text-[#e8220a] transition-colors line-clamp-2">
                        {q.titre}
                      </div>
                      <div className="text-[0.8rem] sm:text-[0.82rem] text-[#666] line-clamp-2 leading-[1.6] mb-3">
                        {excerpt}
                      </div>
                      {/* Auteur + date */}
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-[#222] border border-[rgba(255,255,255,0.08)] overflow-hidden flex items-center justify-center flex-shrink-0">
                          {avatar ? (
                            <Image src={avatar} alt={pseudo} width={20} height={20} className="object-cover w-full h-full" unoptimized />
                          ) : (
                            <UserIcon className="w-3 h-3 text-[#555]" />
                          )}
                        </div>
                        <span className="text-[0.75rem] text-[#777] font-medium">{pseudo}</span>
                        <span className="text-[#444] text-[0.7rem]">·</span>
                        <span className="text-[0.75rem] text-[#555]">{timeAgo(q.created_at)}</span>
                      </div>
                    </div>

                    {/* Flèche */}
                    <ChevronRight className="w-4 h-4 text-[#444] flex-shrink-0 mt-1 group-hover:text-[#e8220a] group-hover:translate-x-1 transition-all" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
