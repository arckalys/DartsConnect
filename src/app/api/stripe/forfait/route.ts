import Stripe from "stripe";

export const runtime = "edge";

const FORFAIT_PRICE = 300; // 3,00€ in cents

export async function POST(req: Request) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-03-25.dahlia",
    });

    const { tournoi_id, tournoi_nom } = await req.json();

    if (!tournoi_id) {
      return Response.json({ error: "Missing tournoi_id" }, { status: 400 });
    }

    const origin = new URL(req.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Forfait publication — DartsTournois",
              description: `Publication du tournoi : ${tournoi_nom || "Sans nom"}`,
            },
            unit_amount: FORFAIT_PRICE,
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "forfait",
        tournoi_id,
      },
      success_url: `${origin}/tournois/${tournoi_id}?forfait=true`,
      cancel_url: `${origin}/tournois/creer?cancelled=true`,
    });

    return Response.json({ url: session.url });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[stripe/forfait] Error:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
