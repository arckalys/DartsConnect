import { Resend } from "resend";
import { emailLayout, emailButton, SITE_URL } from "@/lib/email-template";

export const runtime = "edge";

const FROM = process.env.RESEND_FROM || "DartsTournois <noreply@dartstournois.fr>";

export async function POST(req: Request) {
  try {
    console.log("[email/tableau] Route called");

    if (!process.env.RESEND_API_KEY) {
      console.error("[email/tableau] RESEND_API_KEY not set");
      return Response.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { to, tournoi } = await req.json();

    if (!to || !tournoi?.id || !tournoi?.nom) {
      return Response.json({ error: "Missing fields" }, { status: 400 });
    }

    const html = emailLayout(`
      <h1 style="margin:0 0 8px;font-size:22px;color:#111;">Votre tableau est prêt !</h1>
      <p style="margin:0 0 20px;font-size:14px;color:#666;line-height:1.7;">
        Le tableau de votre tournoi <strong style="color:#111;">${tournoi.nom}</strong> a été généré avec succès.
        Les poules et le bracket de phase finale sont disponibles en ligne.
      </p>

      <table cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0;">
        <tr>
          <td style="padding:12px 16px;background:#f9fafb;border-radius:8px;">
            <div style="font-size:13px;font-weight:700;color:#111;margin-bottom:10px;">Ce que vous pouvez faire maintenant :</div>
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding:6px 0;font-size:14px;color:#333;">
                  <span style="color:#b91c0a;font-weight:700;">1.</span> Consulter et imprimer le tableau
                </td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-size:14px;color:#333;">
                  <span style="color:#b91c0a;font-weight:700;">2.</span> Afficher les poules sur place
                </td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-size:14px;color:#333;">
                  <span style="color:#b91c0a;font-weight:700;">3.</span> Partager le lien avec vos joueurs
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      ${emailButton("Voir et imprimer le tableau", `${SITE_URL}/tournois/${tournoi.id}/tableau`)}

      <p style="margin:20px 0 0;font-size:13px;color:#999;line-height:1.6;">
        Bonne chance pour votre tournoi !<br />
        L&apos;équipe DartsTournois
      </p>
    `);

    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject: `Tableau généré — ${tournoi.nom}`,
      html,
    });

    if (error) {
      console.error("[email/tableau] Resend error:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }
    console.log("[email/tableau] Sent OK, id:", data?.id);
    return Response.json({ ok: true, id: data?.id });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[email/tableau] Exception:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
