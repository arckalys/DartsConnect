import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { emailLayout, emailButton, SITE_URL } from "@/lib/email-template";

export const runtime = "edge";

const FROM = process.env.RESEND_FROM || "DartsTournois <noreply@dartstournois.fr>";

export async function POST(req: Request) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return Response.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return Response.json({ error: "SUPABASE_SERVICE_ROLE_KEY not configured" }, { status: 500 });
    }

    const body = await req.json();
    const { tournoi } = body as {
      tournoi: {
        id: string | number;
        nom: string;
        region: string;
        ville: string;
        date_tournoi: string;
        heure?: string;
        format: string;
      };
    };

    if (!tournoi?.region || !tournoi?.nom) {
      return Response.json({ error: "Missing tournoi data" }, { status: 400 });
    }

    // Admin client avec service role key (serveur uniquement)
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Récupère les profils de la région avec les notifs activées
    const { data: profiles, error: profilesErr } = await adminClient
      .from("profiles")
      .select("id, pseudo, prenom")
      .eq("notifs_region", true)
      .eq("region", tournoi.region);

    if (profilesErr) {
      return Response.json({ error: profilesErr.message }, { status: 500 });
    }

    if (!profiles || profiles.length === 0) {
      return Response.json({ ok: true, sent: 0, message: "Aucun abonné dans cette région" });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    let sent = 0;

    const dateFormatted = new Date(tournoi.date_tournoi).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const tournoiUrl = `${SITE_URL}/tournois/${tournoi.id}`;

    for (const profile of profiles) {
      // Récupère l'email via l'API admin (service role requis)
      const { data: authData } = await adminClient.auth.admin.getUserById(profile.id);
      const email = authData?.user?.email;
      if (!email) continue;

      const displayName = profile.prenom || profile.pseudo || "Joueur";

      const html = emailLayout(`
        <h1 style="margin:0 0 8px;font-size:22px;color:#111;">Nouveau tournoi dans ta région, ${displayName} !</h1>
        <p style="margin:0 0 20px;font-size:14px;color:#666;line-height:1.7;">
          Un nouveau tournoi vient d'être publié en <strong style="color:#111;">${tournoi.region}</strong>.
          Tu reçois cet email parce que tu as activé les alertes tournois pour ta région.
        </p>

        <table cellpadding="0" cellspacing="0" width="100%" style="margin:16px 0 24px;border:1px solid #eee;border-radius:10px;overflow:hidden;">
          <tr style="background:#f9fafb;">
            <td style="padding:14px 18px 6px;font-size:11px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:1px;">Tournoi</td>
          </tr>
          <tr>
            <td style="padding:4px 18px 14px;font-size:20px;font-weight:900;color:#111;">${tournoi.nom}</td>
          </tr>
          <tr style="background:#f9fafb;"><td style="height:1px;background:#eee;"></td></tr>
          <tr>
            <td style="padding:12px 18px;">
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding:5px 0;font-size:13px;color:#999;width:100px;">📅 Date</td>
                  <td style="padding:5px 0;font-size:14px;color:#333;font-weight:500;">${dateFormatted}${tournoi.heure ? " à " + tournoi.heure : ""}</td>
                </tr>
                <tr>
                  <td style="padding:5px 0;font-size:13px;color:#999;">📍 Lieu</td>
                  <td style="padding:5px 0;font-size:14px;color:#333;font-weight:500;">${tournoi.ville}, ${tournoi.region}</td>
                </tr>
                <tr>
                  <td style="padding:5px 0;font-size:13px;color:#999;">🎯 Format</td>
                  <td style="padding:5px 0;font-size:14px;color:#333;font-weight:500;">${tournoi.format}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        ${emailButton("Voir le tournoi et s'inscrire", tournoiUrl)}

        <p style="margin:24px 0 0;font-size:12px;color:#bbb;line-height:1.6;">
          Tu reçois cet email car tu as activé les alertes tournois dans ton profil DartsTournois.<br />
          Pour les désactiver, rends-toi dans <a href="${SITE_URL}/auth" style="color:#b91c0a;">ton profil</a> et désactive l'option.
        </p>
      `);

      await resend.emails.send({
        from: FROM,
        to: email,
        subject: `🎯 Nouveau tournoi en ${tournoi.region} : ${tournoi.nom}`,
        html,
      }).catch(() => {});

      sent++;
    }

    return Response.json({ ok: true, sent });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
