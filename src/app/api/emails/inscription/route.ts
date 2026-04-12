import { Resend } from "resend";
import { emailLayout, emailButton, tournoiInfoTable, SITE_URL } from "@/lib/email-template";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { to, tournoi } = await req.json();

    if (!to || !tournoi?.id || !tournoi?.nom) {
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

    const { error } = await resend.emails.send({
      from: "DartsTournois <noreply@dartstournois.fr>",
      to,
      subject: `Inscription confirmée — ${tournoi.nom}`,
      html,
    });

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
