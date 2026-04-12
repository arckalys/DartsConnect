import { Resend } from "resend";
import { emailLayout, emailButton, tournoiInfoTable, SITE_URL } from "@/lib/email-template";

export const runtime = "edge";

const FROM = "DartsTournois <noreply@dartstournois.fr>";

export async function POST(req: Request) {
  try {
    console.log("[email/inscription] Route called");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const body = await req.json();
    const { to, tournoi } = body;
    console.log("[email/inscription] to:", to, "tournoi:", tournoi?.nom);

    if (!to || !tournoi?.id || !tournoi?.nom) {
      console.log("[email/inscription] Missing fields", { to, tournoiId: tournoi?.id });
      return Response.json({ error: "Missing fields" }, { status: 400 });
    }

    const html = emailLayout(`
      <h1 style="margin:0 0 8px;font-size:22px;color:#111;">Votre inscription est confirmée !</h1>
      <p style="margin:0 0 20px;font-size:14px;color:#666;line-height:1.6;">
        Vous êtes inscrit au tournoi suivant. On compte sur vous !
      </p>
      ${tournoiInfoTable(tournoi)}
      ${emailButton("Voir le tournoi", `${SITE_URL}/tournois/${tournoi.id}`)}
    `);

    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject: `Inscription confirmée — ${tournoi.nom}`,
      html,
    });

    if (error) {
      console.error("[email/inscription] Resend error:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }
    console.log("[email/inscription] Sent OK, id:", data?.id);
    return Response.json({ ok: true, id: data?.id });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[email/inscription] Exception:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
