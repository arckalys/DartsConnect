import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl, supabaseAnonKey } from "@/lib/supabase";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return Response.json({ error: "STRIPE_SECRET_KEY not configured" }, { status: 500 });
    }
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-03-25.dahlia",
    });
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { tournoi_id, user_id } = await req.json();

    if (!tournoi_id || !user_id) {
      return Response.json({ error: "Missing fields" }, { status: 400 });
    }

    // Fetch tournament details
    const { data: tournoi, error: tErr } = await supabase
      .from("tournois")
      .select("*")
      .eq("id", tournoi_id)
      .single();

    if (tErr || !tournoi) {
      return Response.json({ error: "Tournoi introuvable" }, { status: 404 });
    }

    if (tournoi.type_paiement !== "en_ligne" || !tournoi.prix_inscription) {
      return Response.json({ error: "Ce tournoi ne nécessite pas de paiement en ligne" }, { status: 400 });
    }

    const origin = new URL(req.url).origin;
    const priceInCents = Math.round(tournoi.prix_inscription * 100);
    const commission = 50; // 0,50€ in cents

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Inscription — ${tournoi.nom}`,
              description: `Tournoi de fléchettes le ${tournoi.date_tournoi} à ${tournoi.ville}`,
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "inscription",
        tournoi_id,
        user_id,
      },
      success_url: `${origin}/tournois/${tournoi_id}?success=true`,
      cancel_url: `${origin}/tournois/${tournoi_id}`,
    };

    // Add application fee if organizer has a connected Stripe account
    if (tournoi.stripe_account_id) {
      sessionParams.payment_intent_data = {
        application_fee_amount: commission,
        transfer_data: {
          destination: tournoi.stripe_account_id,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return Response.json({ url: session.url });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[stripe/checkout] Error:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
