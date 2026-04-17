import { Resend } from "resend";
import { emailLayout, emailButton, SITE_URL } from "@/lib/email-template";

export const runtime = "edge";

const FROM = process.env.RESEND_FROM || "DartsTournois <noreply@dartstournois.fr>";

export async function POST(req: Request) {
  try {
    console.log("[email/bienvenue] Route called");

    if (!process.env.RESEND_API_KEY) {
      console.error("[email/bienvenue] RESEND_API_KEY is not set — skipping send");
      return Response.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { to, prenom, pseudo } = await req.json();

    if (!to) {
      return Response.json({ error: "Missing email" }, { status: 400 });
    }

    const displayName = prenom || pseudo || "joueur";

    const html = emailLayout(`
      <h1 style="margin:0 0 8px;font-size:22px;color:#111;">Bienvenue sur DartsTournois, ${displayName} !</h1>
      <p style="margin:0 0 20px;font-size:14px;color:#666;line-height:1.7;">
        Ton compte a bien été créé. Tu fais maintenant partie de la communauté des fléchettes en France !
      </p>

      <table cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0;">
        <tr>
          <td style="padding:12px 16px;background:#f9fafb;border-radius:8px;">
            <div style="font-size:13px;font-weight:700;color:#111;margin-bottom:10px;">Ce que tu peux faire maintenant :</div>
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding:6px 0;font-size:14px;color:#333;">
                  <span style="color:#e8220a;font-weight:700;">1.</span> Chercher un tournoi près de chez toi
                </td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-size:14px;color:#333;">
                  <span style="color:#e8220a;font-weight:700;">2.</span> T'inscrire en quelques clics
                </td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-size:14px;color:#333;">
                  <span style="color:#e8220a;font-weight:700;">3.</span> Créer ton propre tournoi
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      ${emailButton("Voir les tournois", `${SITE_URL}/tournois`)}

      <p style="margin:20px 0 0;font-size:13px;color:#999;line-height:1.6;">
        Bonne chance et bonnes fléchettes !<br />
        L'équipe DartsTournois
      </p>
    `);

    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject: "Bienvenue sur DartsTournois !",
      html,
    });

    if (error) {
      console.error("[email/bienvenue] Resend error:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }
    console.log("[email/bienvenue] Sent OK, id:", data?.id);
    return Response.json({ ok: true, id: data?.id });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[email/bienvenue] Exception:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
