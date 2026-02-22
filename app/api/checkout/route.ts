import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

const priceMap: Record<string, string | undefined> = {
  oneShot: process.env.STRIPE_PRICE_ONSHOT,
  subscription: process.env.STRIPE_PRICE_SUBSCRIPTION
};

export async function POST(request: Request) {
  try {
    const { plan } = await request.json();
    const priceId = priceMap[plan as string];
    if (!priceId) {
      return NextResponse.json({ error: "Plan inconnu" }, { status: 400 });
    }

    const origin = request.headers.get("origin") || "https://agentable.vercel.app";

    const stripe = getStripe();
    const isSubscription = plan === "subscription";
    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? "subscription" : "payment",
      line_items: [{ price: priceId, quantity: 1 }],
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
