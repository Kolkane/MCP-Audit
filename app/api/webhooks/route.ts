import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getSupabaseServerClient } from "@/lib/supabase";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret manquant" }, { status: 500 });
  }

  const body = await request.text();
  const signature = headers().get("stripe-signature");

  let event: Stripe.Event;
  try {
    if (!signature) throw new Error("Signature manquante");
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook error", error);
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("orders").insert({
      stripe_id: session.id,
      plan: session.metadata?.plan,
      amount_total: session.amount_total,
      currency: session.currency,
      email: session.customer_details?.email
    });
    if (error) {
      console.error("Supabase insert error", error);
    }
  }

  return NextResponse.json({ received: true });
}
