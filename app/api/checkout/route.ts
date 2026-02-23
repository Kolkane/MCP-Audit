
import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getActivationPrice } from "@/lib/pricing";

export async function POST(request: Request) {
  try {
    const { auditId, addMaintenance } = await request.json();
    if (!auditId) {
      return NextResponse.json({ error: "Audit manquant" }, { status: 400 });
    }

    const origin = request.headers.get("origin") || "https://agentable.vercel.app";
    const supabase = getSupabaseServerClient();
    const stripe = getStripe();

    const { data: audit, error: auditError } = await supabase
      .from("analyses")
      .select("id, url, score, niveau, created_at")
      .eq("id", auditId)
      .single();

    if (auditError || !audit) {
      return NextResponse.json({ error: "Audit introuvable" }, { status: 400 });
    }

    const createdAt = audit.created_at ? new Date(audit.created_at) : null;
    if (!createdAt || Date.now() - createdAt.getTime() > 86_400_000) {
      return NextResponse.json({ error: "Audit expiré" }, { status: 410 });
    }

    const priceInfo = getActivationPrice(audit.score);
    if (!priceInfo.stripePrice) {
      throw new Error("Prix Stripe non configuré pour ce score");
    }

    const maintenancePriceId = process.env.STRIPE_PRICE_MAINTENANCE;
    const lineItems: { price: string; quantity: number }[] = [{ price: priceInfo.stripePrice, quantity: 1 }];

    if (addMaintenance) {
      if (!maintenancePriceId) {
        throw new Error("STRIPE_PRICE_MAINTENANCE manquant");
      }
      lineItems.push({ price: maintenancePriceId, quantity: 1 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: addMaintenance ? "subscription" : "payment",
      line_items: lineItems,
      success_url: `${origin}/merci?session={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/`,
      metadata: {
        auditId: audit.id,
        url: audit.url,
        score: String(audit.score),
        niveau: audit.niveau
      }
    });

    await supabase.from("analyses").update({ statut: "checkout_initiated" }).eq("id", auditId);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error", error);
    return NextResponse.json({ error: "Impossible de créer la session Stripe" }, { status: 500 });
  }
}
