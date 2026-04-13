import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-03-25.dahlia",
    });
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    if (!sig) {
      return Response.json({ error: "Missing signature" }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invalid signature";
      console.error("[stripe/webhook] Signature error:", msg);
      return Response.json({ error: msg }, { status: 400 });
    }

    console.log("[stripe/webhook] Event:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const meta = session.metadata || {};

      if (meta.type === "inscription") {
        // Confirm tournament registration
        const { tournoi_id, user_id } = meta;
        if (tournoi_id && user_id) {
          console.log("[stripe/webhook] Confirming inscription:", tournoi_id, user_id);

          // Check if already inscribed
          const { data: existing } = await supabase
            .from("inscriptions")
            .select("id")
            .eq("user_id", user_id)
            .eq("tournoi_id", tournoi_id)
            .maybeSingle();

          if (!existing) {
            const { error } = await supabase
              .from("inscriptions")
              .insert([{
                user_id,
                tournoi_id,
                statut: "confirme",
              }]);

            if (error) {
              console.error("[stripe/webhook] Insert error:", error);
            } else {
              console.log("[stripe/webhook] Inscription confirmed");

              // Send confirmation email
              const origin = new URL(req.url).origin;

              // Get tournament details
              const { data: tournoi } = await supabase
                .from("tournois")
                .select("nom, date_tournoi, heure, ville, adresse, format, contact_email, nb_joueurs")
                .eq("id", tournoi_id)
                .single();

              // Get user email
              const { data: profile } = await supabase
                .from("profiles")
                .select("email, pseudo, prenom, nom")
                .eq("id", user_id)
                .maybeSingle();

              if (profile?.email && tournoi) {
                fetch(`${origin}/api/emails/inscription`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    to: profile.email,
                    tournoi: { id: tournoi_id, ...tournoi },
                  }),
                }).catch(() => {});
              }

              // Notify organizer
              if (tournoi?.contact_email) {
                const { data: countData } = await supabase
                  .from("inscriptions")
                  .select("id")
                  .eq("tournoi_id", tournoi_id);

                fetch(`${origin}/api/emails/nouveau-inscrit`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    to: tournoi.contact_email,
                    tournoi: { id: tournoi_id, nom: tournoi.nom },
                    joueur: profile || {},
                    inscrits: countData?.length || 0,
                    max: tournoi.nb_joueurs,
                  }),
                }).catch(() => {});
              }
            }
          }
        }
      } else if (meta.type === "forfait") {
        // Mark tournament forfait as paid
        const { tournoi_id } = meta;
        if (tournoi_id) {
          console.log("[stripe/webhook] Marking forfait paid:", tournoi_id);
          const { error } = await supabase
            .from("tournois")
            .update({ forfait_paye: true })
            .eq("id", tournoi_id);
          if (error) console.error("[stripe/webhook] Forfait update error:", error);
        }
      }
    }

    return Response.json({ received: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[stripe/webhook] Error:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
