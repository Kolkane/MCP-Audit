import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

const priceMap: Record<string, string | undefined> = {
  simple: process.env.STRIPE_PRICE_SIMPLE,
  medium: process.env.STRIPE_PRICE_MEDIUM,
  complex: process.env.STRIPE_PRICE_COMPLEX,
  maintenance: process.env.STRIPE_PRICE_MAINTENANCE
};

export async function POST(request: Request) {
  try {
    const { plan, priceId, mode } = await request.json();
    const origin = request.headers.get("origin") || "https://agentable.vercel.app";
    const stripe = getStripe();

    if (priceId) {
      const session = await stripe.checkout.sessions.create({
        mode: mode === "subscription" ? "subscription" : "payment",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${origin}/merci`,
        cancel_url: `${origin}#pricing`
      });
      return NextResponse.json({ url: session.url });
    }

    const mappedPriceId = priceMap[plan as string];
    if (!mappedPriceId) {
      return NextResponse.json({ error: "Plan inconnu" }, { status: 400 });
    }

    const isSubscription = plan === "subscription";
    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? "subscription" : "payment",
      line_items: [{ price: mappedPriceId, quantity: 1 }],
      success_url: `${origin}/merci`,
      cancel_url: `${origin}#pricing`,
      metadata: { plan }
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error", error);
    return NextResponse.json({ error: "Impossible de créer la session Stripe" }, { status: 500 });
  }
}
