import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getResend } from "@/lib/resend";

const leadSchema = z.object({
  firstName: z.string().min(2),
  email: z.string().email(),
  website: z.string().url().or(z.string().min(3)),
  structure: z.string().min(3)
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = leadSchema.parse(json);
    const website = payload.website.startsWith("http") ? payload.website : `https://${payload.website}`;

    const supabase = getSupabaseServerClient();
    const { error: insertError } = await supabase.from("leads").insert({
      first_name: payload.firstName,
      email: payload.email,
      website,
      structure: payload.structure
    });

    if (insertError) throw insertError;

    const resend = getResend();
    await resend.emails.send({
      from: "Agentable <hello@mail.agentable.fr>",
      to: payload.email,
      subject: "Audit bien reçu",
      text: `Merci ${payload.firstName},\nTon audit Agentable démarre maintenant. Tu recevras ton rapport sous 24h.`
    });

    if (process.env.AUDIT_WEBHOOK_URL) {
      await fetch(process.env.AUDIT_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, website })
      });
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Lead error", error);
    const status = error instanceof z.ZodError ? 400 : 500;
    return NextResponse.json({ error: "Impossible de créer l'audit" }, { status });
  }
}
