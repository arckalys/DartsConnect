import { Resend } from "resend";
import { emailLayout, emailButton, SITE_URL } from "@/lib/email-template";

export const runtime = "edge";

const FROM = process.env.RESEND_FROM || "DartsTournois <onboarding@resend.dev>";

export async function POST(req: Request) {
  try {
    console.log("[email/nouveau-inscrit] Route called");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { to, tournoi, joueur, inscrits, max } = await req.json();
    console.log("[email/nouveau-inscrit] to:", to, "tournoi:", tournoi?.nom);

    if (!to || !tournoi?.id || !tournoi?.nom) {
      console.log("[email/nouveau-inscrit] Missing fields", { to, tournoiId: tournoi?.id });
      return Response.json({ error: "Missing fields" }, { status: 400 });
    }

    const joueurName = joueur?.pseudo || [joueur?.prenom, joueur?.nom].filter(Boolean).join(" ") || "Un joueur";

    const html = emailLayout(`
      <h1 style="margin:0 0 8px;font-size:22px;color:#111;">Nouveau joueur inscrit !</h1>
      <p style="margin:0 0 20px;font-size:14px;color:#666;line-height:1.6;">
        <strong style="color:#111;">${joueurName}</strong> vient de s'inscrire à votre tournoi <strong style="color:#111;">${tournoi.nom}</strong>.
      </p>
      <table cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;padding:16px 20px;width:100%;margin:16px 0;">
        <tr><td>
          <span style="font-size:32px;font-weight:900;color:#e8220a;">${inscrits ?? "?"}</span>
          <span style="font-size:14px;color:#999;"> / ${max ?? "?"} joueurs inscrits</span>
        </td></tr>
      </table>
      ${emailButton("Voir le tableau de bord", `${SITE_URL}/tournois/${tournoi.id}/dashboard`)}
    `);

    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject: `Nouvelle inscription — ${tournoi.nom}`,
      html,
    });

    if (error) {
      console.error("[email/nouveau-inscrit] Resend error:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }
    console.log("[email/nouveau-inscrit] Sent OK, id:", data?.id);
    return Response.json({ ok: true, id: data?.id });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[email/nouveau-inscrit] Exception:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
