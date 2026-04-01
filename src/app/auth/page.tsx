"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase";
import { REGIONS, NIVEAU_LABELS } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

export const runtime = "edge";

type AuthView = "main" | "forgot" | "profile";
type AuthTab = "login" | "register";

export default function AuthPage() {
  const router = useRouter();
  const supabase = createClient();

  const [view, setView] = useState<AuthView>("main");
  const [tab, setTab] = useState<AuthTab>("login");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Messages
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Login fields
  const [lEmail, setLEmail] = useState("");
  const [lPwd, setLPwd] = useState("");
  const [lPwdVisible, setLPwdVisible] = useState(false);

  // Register fields
  const [rPrenom, setRPrenom] = useState("");
  const [rNom, setRNom] = useState("");
  const [rPseudo, setRPseudo] = useState("");
  const [rEmail, setREmail] = useState("");
  const [rPwd, setRPwd] = useState("");
  const [rPwdVisible, setRPwdVisible] = useState(false);
  const [rNiveau, setRNiveau] = useState("");
  const [rRegion, setRRegion] = useState("");

  // Forgot field
  const [fEmail, setFEmail] = useState("");

  // Profile fields
  const [ePrenom, setEPrenom] = useState("");
  const [eNom, setENom] = useState("");
  const [ePseudo, setEPseudo] = useState("");
  const [eNiveau, setENiveau] = useState("debutant");
  const [eRegion, setERegion] = useState("");
  const [eBio, setEBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password validation
  const pwRuleLen = rPwd.length >= 8;
  const pwRuleUpper = /[A-Z]/.test(rPwd);
  const pwRuleNum = /[0-9]/.test(rPwd);

  function showError(msg: string) {
    setError(msg);
    setSuccess("");
    setTimeout(() => setError(""), 5000);
  }

  function showSuccess(msg: string) {
    setSuccess(msg);
    setError("");
    setTimeout(() => setSuccess(""), 5000);
  }

  function loadProfile(u: User) {
    const m = u.user_metadata || {};
    setEPrenom(m.prenom || "");
    setENom(m.nom || "");
    setEPseudo(m.pseudo || "");
    setENiveau(m.niveau || "debutant");
    setERegion(m.region || "");
    setEBio(m.bio || "");
    setAvatarUrl(m.avatar_url || "");
    setUser(u);
    setView("profile");
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      return showError("Le fichier doit être une image (JPG, PNG, etc.).");
    }
    if (file.size > 2 * 1024 * 1024) {
      return showError("L'image ne doit pas dépasser 2 Mo.");
    }

    setAvatarLoading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const filePath = `${user.id}/avatar.${ext}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        setAvatarLoading(false);
        return showError("Erreur upload : " + uploadError.message);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl + "?t=" + Date.now();

      // Save URL in user metadata
      const { data, error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });

      if (updateError) {
        setAvatarLoading(false);
        return showError("Erreur mise à jour : " + updateError.message);
      }

      setAvatarUrl(publicUrl);
      if (data.user) setUser(data.user);
      showSuccess("Photo de profil mise à jour !");
    } catch {
      showError("Erreur lors de l'upload.");
    } finally {
      setAvatarLoading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // Auto-login check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) loadProfile(session.user);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function doLogin() {
    if (!lEmail || !lPwd) return showError("Remplis tous les champs.");
    setLoading(true);
    const { data, error: err } = await supabase.auth.signInWithPassword({ email: lEmail, password: lPwd });
    setLoading(false);
    if (err) return showError(err.message === "Invalid login credentials" ? "Email ou mot de passe incorrect." : err.message);
    loadProfile(data.user);
  }

  async function doRegister() {
    if (!rPrenom || !rNom || !rPseudo || !rEmail || !rPwd) return showError("Remplis tous les champs obligatoires.");
    if (rPwd.length < 8) return showError("Mot de passe trop court.");
    setLoading(true);
    const { data, error: err } = await supabase.auth.signUp({
      email: rEmail,
      password: rPwd,
      options: {
        data: { prenom: rPrenom, nom: rNom, pseudo: rPseudo, niveau: rNiveau, region: rRegion },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (err) return showError(err.message);
    if (data.user && !data.session) {
      showSuccess("Compte créé ! Vérifie ta boite mail.");
    } else if (data.session) {
      loadProfile(data.user!);
    }
  }

  async function doForgot() {
    if (!fEmail) return showError("Entre ton email.");
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(fEmail, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    setLoading(false);
    if (err) return showError(err.message);
    showSuccess("Email envoyé ! Vérifie ta boite mail.");
  }

  async function doSave() {
    setLoading(true);
    const { data, error: err } = await supabase.auth.updateUser({
      data: { prenom: ePrenom, nom: eNom, pseudo: ePseudo, niveau: eNiveau, region: eRegion, bio: eBio },
    });
    setLoading(false);
    if (err) return showError(err.message);
    loadProfile(data.user);
    showSuccess("Profil mis à jour !");
  }

  async function doLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setView("main");
    setTab("login");
  }

  const meta = user?.user_metadata || {};
  const displayName = (meta.prenom || "") + (meta.nom ? " " + meta.nom : "") || user?.email || "—";

  return (
    <div className="animate-page-in min-h-screen flex items-center justify-center px-4 sm:px-6 pt-[80px] pb-8">

      {/* ── LOGIN / REGISTER ── */}
      {view === "main" && (
        <div className="w-full max-w-[440px] bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[18px] p-6 sm:p-10 animate-fade-up">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="w-[52px] h-[52px] bg-[rgba(232,34,10,0.12)] border border-[rgba(232,34,10,0.3)] rounded-[14px] flex items-center justify-center text-[1.5rem] mx-auto mb-4">🎯</div>
            <div className="font-barlow-condensed font-black text-[1.8rem] uppercase">DartsConnect.FR</div>
            <div className="text-[0.88rem] text-[#777] mt-[6px]">Rejoins la communauté des fléchettes</div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-[#111] rounded-[10px] p-1 mb-7">
            <button onClick={() => setTab("login")} className={`flex-1 text-center py-2 rounded-[7px] text-[0.88rem] font-semibold border-none cursor-pointer transition-all ${tab === "login" ? "bg-[#141414] text-white shadow-[0_1px_6px_rgba(0,0,0,0.4)]" : "bg-transparent text-[#777]"}`}>
              Connexion
            </button>
            <button onClick={() => setTab("register")} className={`flex-1 text-center py-2 rounded-[7px] text-[0.88rem] font-semibold border-none cursor-pointer transition-all ${tab === "register" ? "bg-[#141414] text-white shadow-[0_1px_6px_rgba(0,0,0,0.4)]" : "bg-transparent text-[#777]"}`}>
              Inscription
            </button>
          </div>

          {/* Messages */}
          {error && <div className="msg msg-error show"><span>⚠️</span><span>{error}</span></div>}
          {success && <div className="msg msg-success show"><span>✅</span><span>{success}</span></div>}

          {/* LOGIN TAB */}
          {tab === "login" && (
            <div>
              <div className="mb-4">
                <label className="block text-[0.82rem] font-semibold text-[#ccc] mb-[6px]">Email</label>
                <input type="email" value={lEmail} onChange={(e) => setLEmail(e.target.value)} placeholder="ton@email.fr" />
              </div>
              <div className="mb-4">
                <label className="block text-[0.82rem] font-semibold text-[#ccc] mb-[6px]">Mot de passe</label>
                <div className="relative">
                  <input type={lPwdVisible ? "text" : "password"} value={lPwd} onChange={(e) => setLPwd(e.target.value)} placeholder="••••••••" className="!pr-[42px]" />
                  <button onClick={() => setLPwdVisible(!lPwdVisible)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none text-[#777] cursor-pointer text-[1rem] p-1">{lPwdVisible ? "🙈" : "👁"}</button>
                </div>
              </div>
              <div className="text-right mb-5">
                <button onClick={() => setView("forgot")} className="text-[#e8220a] font-semibold cursor-pointer bg-transparent border-none text-[0.82rem] font-barlow hover:underline">Mot de passe oublié ?</button>
              </div>
              <button onClick={doLogin} disabled={loading} className="w-full py-[13px] rounded-[10px] font-barlow-condensed font-bold text-[1.05rem] tracking-[0.5px] cursor-pointer border-none bg-[#e8220a] text-white shadow-red-glow-lg hover:bg-[#b81a08] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {loading ? <div className="spinner" /> : "Se connecter"}
              </button>
              <p className="text-center text-[0.84rem] text-[#777] mt-5">
                Pas de compte ? <button onClick={() => setTab("register")} className="text-[#e8220a] font-semibold cursor-pointer bg-transparent border-none font-barlow text-inherit hover:underline">S&apos;inscrire</button>
              </p>
            </div>
          )}

          {/* REGISTER TAB */}
          {tab === "register" && (
            <div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-[0.82rem] font-semibold text-[#ccc] mb-[6px]">Prénom *</label>
                  <input type="text" value={rPrenom} onChange={(e) => setRPrenom(e.target.value)} placeholder="Jean" />
                </div>
                <div>
                  <label className="block text-[0.82rem] font-semibold text-[#ccc] mb-[6px]">Nom *</label>
                  <input type="text" value={rNom} onChange={(e) => setRNom(e.target.value)} placeholder="Dupont" />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-[0.82rem] font-semibold text-[#ccc] mb-[6px]">Pseudo *</label>
                <input type="text" value={rPseudo} onChange={(e) => setRPseudo(e.target.value)} placeholder="DartMaster69" />
              </div>
              <div className="mb-4">
                <label className="block text-[0.82rem] font-semibold text-[#ccc] mb-[6px]">Email *</label>
                <input type="email" value={rEmail} onChange={(e) => setREmail(e.target.value)} placeholder="ton@email.fr" />
              </div>
              <div className="mb-4">
                <label className="block text-[0.82rem] font-semibold text-[#ccc] mb-[6px]">Mot de passe *</label>
                <div className="relative">
                  <input type={rPwdVisible ? "text" : "password"} value={rPwd} onChange={(e) => setRPwd(e.target.value)} placeholder="Min. 8 caractères" className="!pr-[42px]" />
                  <button onClick={() => setRPwdVisible(!rPwdVisible)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none text-[#777] cursor-pointer text-[1rem] p-1">{rPwdVisible ? "🙈" : "👁"}</button>
                </div>
                <div className="mt-[6px] flex flex-col gap-[3px]">
                  <div className={`pw-rule text-[0.76rem] text-[#777] flex items-center gap-[6px] ${pwRuleLen ? "ok" : ""}`}>Au moins 8 caractères</div>
                  <div className={`pw-rule text-[0.76rem] text-[#777] flex items-center gap-[6px] ${pwRuleUpper ? "ok" : ""}`}>Une majuscule</div>
                  <div className={`pw-rule text-[0.76rem] text-[#777] flex items-center gap-[6px] ${pwRuleNum ? "ok" : ""}`}>Un chiffre</div>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-[0.82rem] font-semibold text-[#ccc] mb-[6px]">Niveau</label>
                <select value={rNiveau} onChange={(e) => setRNiveau(e.target.value)}>
                  <option value="">Sélectionne ton niveau</option>
                  <option value="debutant">Débutant</option>
                  <option value="intermediaire">Intermédiaire</option>
                  <option value="confirme">Confirmé</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-[0.82rem] font-semibold text-[#ccc] mb-[6px]">Région</label>
                <select value={rRegion} onChange={(e) => setRRegion(e.target.value)}>
                  <option value="">Ta région</option>
                  {REGIONS.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
              <button onClick={doRegister} disabled={loading} className="w-full py-[13px] rounded-[10px] font-barlow-condensed font-bold text-[1.05rem] tracking-[0.5px] cursor-pointer border-none bg-[#e8220a] text-white shadow-red-glow-lg hover:bg-[#b81a08] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {loading ? <div className="spinner" /> : "Créer mon compte"}
              </button>
              <p className="text-center text-[0.84rem] text-[#777] mt-5">
                Déjà un compte ? <button onClick={() => setTab("login")} className="text-[#e8220a] font-semibold cursor-pointer bg-transparent border-none font-barlow text-inherit hover:underline">Se connecter</button>
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── FORGOT PASSWORD ── */}
      {view === "forgot" && (
        <div className="w-full max-w-[440px] bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[18px] p-6 sm:p-10 animate-fade-up">
          <div className="mb-8 text-center">
            <div className="w-[52px] h-[52px] bg-[rgba(232,34,10,0.12)] border border-[rgba(232,34,10,0.3)] rounded-[14px] flex items-center justify-center text-[1.5rem] mx-auto mb-4">🔑</div>
            <div className="font-barlow-condensed font-black text-[1.8rem] uppercase">Mot de passe oublié</div>
            <div className="text-[0.88rem] text-[#777] mt-[6px]">On t&apos;envoie un lien de réinitialisation</div>
          </div>
          {error && <div className="msg msg-error show"><span>⚠️</span><span>{error}</span></div>}
          {success && <div className="msg msg-success show"><span>✅</span><span>{success}</span></div>}
          <div className="mb-4">
            <label className="block text-[0.82rem] font-semibold text-[#ccc] mb-[6px]">Email</label>
            <input type="email" value={fEmail} onChange={(e) => setFEmail(e.target.value)} placeholder="ton@email.fr" />
          </div>
          <button onClick={doForgot} disabled={loading} className="w-full py-[13px] rounded-[10px] font-barlow-condensed font-bold text-[1.05rem] tracking-[0.5px] cursor-pointer border-none bg-[#e8220a] text-white shadow-red-glow-lg hover:bg-[#b81a08] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {loading ? <div className="spinner" /> : "Envoyer le lien"}
          </button>
          <button onClick={() => { setView("main"); setError(""); setSuccess(""); }} className="w-full py-[13px] rounded-[10px] font-barlow-condensed font-bold text-[0.9rem] cursor-pointer bg-transparent text-white border border-[rgba(255,255,255,0.08)] mt-[10px] hover:bg-[rgba(255,255,255,0.05)]">
            ← Retour
          </button>
        </div>
      )}

      {/* ── PROFILE ── */}
      {view === "profile" && (
        <div className="w-full max-w-[520px] bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[18px] p-6 sm:p-10 animate-fade-up">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3 mb-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarLoading}
              className="relative w-[84px] h-[84px] rounded-full bg-[#111] border-2 border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[1.8rem] cursor-pointer group overflow-hidden transition-all hover:border-[#e8220a] disabled:cursor-wait"
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Avatar"
                  fill
                  className="object-cover rounded-full"
                  unoptimized
                />
              ) : (
                <span>👤</span>
              )}
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-[rgba(0,0,0,0.5)] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {avatarLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                )}
              </div>
            </button>
            <div>
              <div className="font-barlow-condensed font-extrabold text-[1.4rem] text-center">{displayName}</div>
              <div className="text-[0.84rem] text-[#777] text-center">{user?.email}</div>
              <div className="inline-flex items-center gap-[6px] bg-[rgba(232,34,10,0.12)] border border-[rgba(232,34,10,0.3)] rounded-full px-3 py-1 text-[0.78rem] font-bold text-[#e8220a] mt-1">
                {NIVEAU_LABELS[meta.niveau] || "🎯 Niveau non défini"}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-[10px] mb-6">
            <div className="bg-[#111] border border-[rgba(255,255,255,0.08)] rounded-[10px] p-3 text-center">
              <div className="font-barlow-condensed text-[1.6rem] font-black text-[#e8220a]">0</div>
              <div className="text-[0.72rem] text-[#777] mt-[2px]">Tournois</div>
            </div>
            <div className="bg-[#111] border border-[rgba(255,255,255,0.08)] rounded-[10px] p-3 text-center">
              <div className="font-barlow-condensed text-[1.6rem] font-black text-[#e8220a]">0</div>
              <div className="text-[0.72rem] text-[#777] mt-[2px]">Victoires</div>
            </div>
            <div className="bg-[#111] border border-[rgba(255,255,255,0.08)] rounded-[10px] p-3 text-center">
              <div className="font-barlow-condensed text-[1.6rem] font-black text-[#e8220a]">{(meta.region || "—").substring(0, 8)}</div>
              <div className="text-[0.72rem] text-[#777] mt-[2px]">Région</div>
            </div>
          </div>

          {/* Messages */}
          {error && <div className="msg msg-error show"><span>⚠️</span><span>{error}</span></div>}
          {success && <div className="msg msg-success show"><span>✅</span><span>{success}</span></div>}

          {/* Edit profile */}
          <div className="font-barlow-condensed text-[1.1rem] font-extrabold uppercase tracking-[0.5px] mb-4">Modifier mon profil</div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-[0.82rem] font-semibold text-[#ccc] mb-[6px]">Prénom</label>
              <input type="text" value={ePrenom} onChange={(e) => setEPrenom(e.target.value)} />
            </div>
            <div>
              <label className="block text-[0.82rem] font-semibold text-[#ccc] mb-[6px]">Nom</label>
              <input type="text" value={eNom} onChange={(e) => setENom(e.target.value)} />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-[0.82rem] font-semibold text-[#ccc] mb-[6px]">Pseudo</label>
            <input type="text" value={ePseudo} onChange={(e) => setEPseudo(e.target.value)} />
          </div>
          <div className="mb-4">
            <label className="block text-[0.82rem] font-semibold text-[#ccc] mb-[6px]">Niveau</label>
            <select value={eNiveau} onChange={(e) => setENiveau(e.target.value)}>
              <option value="debutant">Débutant</option>
              <option value="intermediaire">Intermédiaire</option>
              <option value="confirme">Confirmé</option>
              <option value="expert">Expert</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-[0.82rem] font-semibold text-[#ccc] mb-[6px]">Région</label>
            <select value={eRegion} onChange={(e) => setERegion(e.target.value)}>
              <option value="">Ma région</option>
              {REGIONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-[0.82rem] font-semibold text-[#ccc] mb-[6px]">Bio</label>
            <textarea value={eBio} onChange={(e) => setEBio(e.target.value)} placeholder="Parle de toi..." />
          </div>
          <button onClick={doSave} disabled={loading} className="w-full py-[13px] rounded-[10px] font-barlow-condensed font-bold text-[1.05rem] tracking-[0.5px] cursor-pointer border-none bg-[#e8220a] text-white shadow-red-glow-lg hover:bg-[#b81a08] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {loading ? <div className="spinner" /> : "Sauvegarder"}
          </button>
          <div className="flex items-center gap-[10px] mt-[10px]">
            <button onClick={() => router.push("/")} className="flex-1 py-[13px] rounded-[10px] font-barlow-condensed font-bold text-[0.9rem] cursor-pointer bg-transparent text-white border border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.05)]">
              ← Accueil
            </button>
            <button onClick={doLogout} className="flex-1 py-[13px] rounded-[10px] font-barlow-condensed font-bold text-[0.88rem] cursor-pointer bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.25)] text-[#f87171]">
              Se déconnecter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
