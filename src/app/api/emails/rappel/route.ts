import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { emailLayout, emailButton, tournoiInfoTable, SITE_URL } from "@/lib/email-template";

export const runtime = "edge";

const FROM = "DartsTournois <noreply@dartstournois.fr>";

export async function POST(req: Request) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    // Optional: verify a shared secret to prevent unauthorized calls
    const { secret } = await req.json().catch(() => ({ secret: undefined }));
    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find tournaments happening tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const { data: tournois, error: tErr } = await supabaseAdmin
      .from("tournois")
      .select("*")
      .eq("date_tournoi", tomorrowStr);

    if (tErr || !tournois || tournois.length === 0) {
      return Response.json({ ok: true, sent: 0, message: "No tournaments tomorrow" });
    }

    let totalSent = 0;

    for (const tournoi of tournois) {
      // Get inscriptions for this tournament
      const { data: inscriptions } = await supabaseAdmin
        .from("inscriptions")
        .select("user_id")
        .eq("tournoi_id", tournoi.id);

      if (!inscriptions || inscriptions.length === 0) continue;

      const userIds = inscriptions.map((i: { user_id: string }) => i.user_id);
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id, email")
        .in("id", userIds);

      if (!profiles) continue;

      for (const profile of profiles) {
        if (!profile.email) continue;

        const html = emailLayout(`
          <h1 style="margin:0 0 8px;font-size:22px;color:#111;">Votre tournoi est demain !</h1>
          <p style="margin:0 0 20px;font-size:14px;color:#666;line-height:1.6;">
            N'oubliez pas, vous êtes inscrit au tournoi suivant qui a lieu <strong style="color:#111;">demain</strong> :
          </p>
          ${tournoiInfoTable(tournoi)}
          ${emailButton("Voir le tournoi", `${SITE_URL}/tournois/${tournoi.id}`)}
          <p style="margin:16px 0 0;font-size:13px;color:#999;">Bonne chance et bonnes fléchettes !</p>
        `);

        await resend.emails.send({
          from: FROM,
          to: profile.email,
          subject: `Rappel — ${tournoi.nom} c'est demain !`,
          html,
        });
        totalSent++;
      }
    }

    return Response.json({ ok: true, sent: totalSent });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
