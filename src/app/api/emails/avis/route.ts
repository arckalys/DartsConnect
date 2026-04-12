import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { emailLayout, emailButton, SITE_URL } from "@/lib/email-template";

export const runtime = "edge";

const FROM = process.env.RESEND_FROM || "DartsTournois <onboarding@resend.dev>";

export async function POST(req: Request) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { secret } = await req.json().catch(() => ({ secret: undefined }));
    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find tournaments that ended yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const { data: tournois, error: tErr } = await supabaseAdmin
      .from("tournois")
      .select("*")
      .eq("date_tournoi", yesterdayStr);

    if (tErr || !tournois || tournois.length === 0) {
      return Response.json({ ok: true, sent: 0, message: "No tournaments yesterday" });
    }

    let totalSent = 0;

    for (const tournoi of tournois) {
      const { data: inscriptions } = await supabaseAdmin
        .from("inscriptions")
        .select("user_id")
        .eq("tournoi_id", tournoi.id);

      if (!inscriptions || inscriptions.length === 0) continue;

      const userIds = inscriptions.map((i: { user_id: string }) => i.user_id);

      // Exclude users who already rated
      const { data: existingAvis } = await supabaseAdmin
        .from("avis")
        .select("user_id")
        .eq("tournoi_id", tournoi.id);

      const alreadyRated = new Set((existingAvis || []).map((a: { user_id: string }) => a.user_id));
      const toNotify = userIds.filter((uid: string) => !alreadyRated.has(uid));

      if (toNotify.length === 0) continue;

      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id, email")
        .in("id", toNotify);

      if (!profiles) continue;

      for (const profile of profiles) {
        if (!profile.email) continue;

        const html = emailLayout(`
          <h1 style="margin:0 0 8px;font-size:22px;color:#111;">Comment s'est passé votre tournoi ?</h1>
          <p style="margin:0 0 20px;font-size:14px;color:#666;line-height:1.6;">
            Vous avez participé au tournoi <strong style="color:#111;">${tournoi.nom}</strong> hier.
            Votre avis compte ! Notez ce tournoi pour aider les autres joueurs.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:16px 0;text-align:center;width:100%;">
            <tr><td>
              <span style="font-size:36px;">🎯 ⭐⭐⭐⭐⭐</span>
            </td></tr>
          </table>
          ${emailButton("Noter ce tournoi", `${SITE_URL}/tournois/${tournoi.id}`)}
          <p style="margin:16px 0 0;font-size:13px;color:#999;">Merci pour votre retour !</p>
        `);

        await resend.emails.send({
          from: FROM,
          to: profile.email,
          subject: `Votre avis — ${tournoi.nom}`,
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
