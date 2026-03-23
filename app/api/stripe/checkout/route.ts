import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return new Response("Unauthorized", { status: 401 });

  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return new Response("Unauthorized", { status: 401 });

  // 開発中: 管理者のみ
  if (user.email !== "scandalxxx.1119@gmail.com") {
    return new Response("Not available", { status: 403 });
  }

  const { priceId } = await req.json();
  if (!priceId) return new Response("priceId required", { status: 400 });

  const { data: profile } = await supabase
    .from("aa_profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  let customerId = profile?.stripe_customer_id as string | undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email });
    customerId = customer.id;
    await supabase
      .from("aa_profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://app-atelier.vercel.app"}/profile?plan=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://app-atelier.vercel.app"}/profile`,
    metadata: { user_id: user.id },
  });

  return NextResponse.json({ url: session.url });
}
