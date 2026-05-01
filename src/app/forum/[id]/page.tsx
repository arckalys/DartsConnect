"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageSquare, Send, AlertTriangle, Trash2, User as UserIcon, Check } from "lucide-react";
import { createClient } from "@/lib/supabase";
import Footer from "@/components/Footer";
import type { User } from "@supabase/supabase-js";

export const runtime = "edge";

interface Profile {
  pseudo: string | null;
  avatar_url: string | null;
}

interface Question {
  id: number;
  user_id: string;
  titre: string;
  contenu: string;
  created_at: string;
  profiles: Profile | null;
}

interface Reponse {
  id: number;
  user_id: string;
  contenu: string;
  created_at: string;
  profiles: Profile | null;
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

function Avatar({ profile, size = 36 }: { profile: Profile | null; size?: number }) {
  const pseudo = profile?.pseudo || "?";
  const avatar = profile?.avatar_url;
  return (
    <div
      className="rounded-full bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)] overflow-hidden flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}
    >
      {avatar ? (
        <Image src={avatar} alt={pseudo} width={size} height={size} className="object-cover w-full h-full" unoptimized />
      ) : (
        <UserIcon className="text-[#555]" style={{ width: size * 0.5, height: size * 0.5 }} />
      )}
    </div>
  );
}

export default function ForumDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [question, setQuestion] = useState<Question | null>(null);
  const [reponses, setReponses] = useState<Reponse[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Formulaire réponse
  const [reponse, setReponse] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    fetchData();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchData() {
    setLoading(true);

    const [{ data: q }, { data: r }] = await Promise.all([
      supabase
        .from("forum_questions")
        .select("id, user_id, titre, contenu, created_at")
        .eq("id", id)
        .single(),
      supabase
        .from("forum_reponses")
        .select("id, user_id, contenu, created_at")
        .eq("question_id", id)
        .order("created_at", { ascending: true }),
    ]);

    if (!q) { setNotFound(true); setLoading(false); return; }

    // Récupère les profils de tous les auteurs en une seule requête
    const allUserIds = [...new Set([q.user_id, ...(r ?? []).map((rep) => rep.user_id)])];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, pseudo, avatar_url")
      .in("id", allUserIds);

    const profilesMap = Object.fromEntries(
      (profilesData ?? []).map((p) => [p.id, p])
    );

    setQuestion({ ...q, profiles: profilesMap[q.user_id] ?? null } as unknown as Question);
    setReponses(
      (r ?? []).map((rep) => ({ ...rep, profiles: profilesMap[rep.user_id] ?? null })) as unknown as Reponse[]
    );
    setLoading(false);
  }

  async function postReponse() {
    if (!reponse.trim()) return setError("La réponse ne peut pas être vide.");
    if (!user) return setError("Tu dois être connecté.");
    setPosting(true);
    setError("");
    const { error: err } = await supabase
      .from("forum_reponses")
      .insert({ question_id: parseInt(id), user_id: user.id, contenu: reponse.trim() });
    setPosting(false);
    if (err) return setError(err.message);
    setReponse("");
    setSuccessMsg("Réponse publiée !");
    setTimeout(() => setSuccessMsg(""), 3000);
    fetchData();
  }

  async function deleteQuestion() {
    if (!confirm("Supprimer cette question ?")) return;
    await supabase.from("forum_questions").delete().eq("id", id);
    router.push("/forum");
  }

  async function deleteReponse(reponseId: number) {
    if (!confirm("Supprimer cette réponse ?")) return;
    await supabase.from("forum_reponses").delete().eq("id", reponseId);
    setReponses((prev) => prev.filter((r) => r.id !== reponseId));
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-[rgba(232,34,10,0.3)] border-t-[#e8220a] rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !question) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-[#555]">
        <MessageSquare className="w-14 h-14 opacity-30" />
        <div className="font-barlow-condensed font-bold text-[1.4rem]">Question introuvable</div>
        <Link href="/forum" className="text-[#e8220a] hover:underline text-[0.9rem]">← Retour au forum</Link>
      </div>
    );
  }

  const pseudo = question.profiles?.pseudo || "Joueur";

  return (
    <div className="animate-page-in min-h-screen flex flex-col">
      <div className="flex-1 pt-[72px] xs:pt-[80px] px-3 xs:px-4 sm:px-6 lg:px-10 pb-12">
        <div className="max-w-[820px] mx-auto">

          {/* Retour */}
          <div className="mt-5 mb-6">
            <Link href="/forum" className="inline-flex items-center gap-2 text-[0.84rem] text-[#777] hover:text-white transition-colors no-underline">
              <ArrowLeft className="w-4 h-4" /> Retour au forum
            </Link>
          </div>

          {/* Question */}
          <div className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[16px] p-5 sm:p-7 mb-4">
            <div className="flex items-start justify-between gap-3 mb-4">
              <h1 className="font-barlow-condensed font-black text-[1.2rem] sm:text-[1.5rem] uppercase leading-[1.2] text-white flex-1">
                {question.titre}
              </h1>
              {user?.id === question.user_id && (
                <button
                  onClick={deleteQuestion}
                  className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-[8px] bg-transparent border border-[rgba(255,255,255,0.07)] text-[#555] hover:border-[#dc2626] hover:text-[#dc2626] cursor-pointer transition-all"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <p className="text-[0.88rem] sm:text-[0.92rem] text-[#bbb] leading-[1.8] whitespace-pre-wrap mb-5">
              {question.contenu}
            </p>

            {/* Auteur */}
            <div className="flex items-center gap-3 pt-4 border-t border-[rgba(255,255,255,0.06)]">
              <Avatar profile={question.profiles} size={32} />
              <div>
                <div className="text-[0.82rem] font-semibold text-white">{pseudo}</div>
                <div className="text-[0.74rem] text-[#555]">{timeAgo(question.created_at)}</div>
              </div>
              <div className="ml-auto flex items-center gap-2 text-[0.78rem] text-[#555]">
                <MessageSquare className="w-3.5 h-3.5" />
                {reponses.length} réponse{reponses.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>

          {/* Réponses */}
          {reponses.length > 0 && (
            <div className="mb-4">
              <div className="font-barlow-condensed font-extrabold text-[1rem] uppercase tracking-[0.5px] text-[#777] mb-3 px-1">
                {reponses.length} réponse{reponses.length !== 1 ? "s" : ""}
              </div>
              <div className="flex flex-col gap-3">
                {reponses.map((r, idx) => {
                  const rPseudo = r.profiles?.pseudo || "Joueur";
                  const isOwn = user?.id === r.user_id;
                  return (
                    <div
                      key={r.id}
                      className="bg-[#141414] border border-[rgba(255,255,255,0.07)] rounded-[14px] p-4 sm:p-5 flex gap-3 sm:gap-4"
                    >
                      {/* Numéro */}
                      <div className="flex-shrink-0 flex flex-col items-center gap-2 pt-[2px]">
                        <Avatar profile={r.profiles} size={34} />
                        <div className="text-[0.65rem] text-[#444] font-bold">#{idx + 1}</div>
                      </div>

                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div>
                            <span className="text-[0.84rem] font-semibold text-white">{rPseudo}</span>
                            <span className="text-[#555] mx-2 text-[0.7rem]">·</span>
                            <span className="text-[0.76rem] text-[#555]">{timeAgo(r.created_at)}</span>
                          </div>
                          {isOwn && (
                            <button
                              onClick={() => deleteReponse(r.id)}
                              className="w-7 h-7 flex items-center justify-center rounded-[7px] bg-transparent border border-transparent text-[#444] hover:border-[#dc2626] hover:text-[#dc2626] cursor-pointer transition-all"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-[0.86rem] sm:text-[0.88rem] text-[#bbb] leading-[1.75] whitespace-pre-wrap">
                          {r.contenu}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Formulaire réponse */}
          <div className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[16px] p-5 sm:p-6 mt-4">
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

            {user ? (
              <>
                <div className="font-barlow-condensed font-extrabold text-[1rem] uppercase tracking-[0.5px] mb-3 text-[#e8220a]">
                  Ta réponse
                </div>
                <textarea
                  value={reponse}
                  onChange={(e) => setReponse(e.target.value)}
                  placeholder="Partage ton expérience ou ta réponse..."
                  maxLength={2000}
                  rows={4}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[0.72rem] text-[#444]">{reponse.length}/2000</span>
                  <button
                    onClick={postReponse}
                    disabled={posting || !reponse.trim()}
                    className="flex items-center gap-2 bg-[#e8220a] text-white font-barlow-condensed font-bold text-[0.95rem] px-5 py-[10px] rounded-[10px] border-none cursor-pointer transition-all hover:bg-[#b81a08] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {posting ? <div className="spinner" /> : <><Send className="w-4 h-4" /> Répondre</>}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-5">
                <div className="text-[0.88rem] text-[#777] mb-3">Connecte-toi pour répondre à cette question</div>
                <Link
                  href="/auth"
                  className="inline-flex items-center gap-2 bg-[#e8220a] text-white font-barlow-condensed font-bold text-[0.95rem] px-6 py-[10px] rounded-[10px] no-underline hover:bg-[#b81a08] transition-all"
                >
                  Se connecter
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
      <Footer />
    </div>
  );
}
