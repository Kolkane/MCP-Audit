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
    const body = await request.json();
    const origin = request.headers.get("origin") || "https://agentable.vercel.app";
    const stripe = getStripe();

    if (body.activationPrice) {
      const lineItems = [{ price: body.activationPrice as string, quantity: 1 }];
      if (body.addMaintenance && process.env.STRIPE_PRICE_MAINTENANCE) {
        lineItems.push({ price: process.env.STRIPE_PRICE_MAINTENANCE, quantity: 1 });
      }

      const session = await stripe.checkout.sessions.create({
        mode: body.addMaintenance ? "subscription" : "payment",
        line_items: lineItems,
        success_url: `${origin}/merci?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/`,
        ...(body.addMaintenance
          ? {
              subscription_data: {
                metadata: {
                  activation: body.activationPrice
                }
              }
            }
          : {})
      });

      return NextResponse.json({ url: session.url });
    }

    const { plan } = body;
    const mappedPriceId = priceMap[plan as string];
    if (!mappedPriceId) {
      return NextResponse.json({ error: "Plan inconnu" }, { status: 400 });
    }

    const isSubscription = plan === "maintenance";
    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? "subscription" : "payment",
      line_items: [{ price: mappedPriceId, quantity: 1 }],
      success_url: `${origin}/merci?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/`,
      metadata: { plan }
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error", error);
    return NextResponse.json({ error: "Impossible de créer la session Stripe" }, { status: 500 });
  }
}
