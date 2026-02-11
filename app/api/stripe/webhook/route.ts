import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia" as any,
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;

    if (orderId) {
      const supabase = getSupabaseAdmin();

      // 1. Mettre à jour le statut de la commande
      await supabase
        .from("orders")
        .update({
          status: "paid",
          paid_at: new Date(),
        })
        .eq("id", orderId);

      // 2. Créditer les points de fidélité (1€ = 1pt)
      const amountTotal = session.amount_total || 0;
      const pointsToAdd = Math.floor(amountTotal / 100);
      const userId = session.metadata?.userId;

      if (userId && pointsToAdd > 0) {
        // Récupérer les points actuels
        const { data: loyalty } = await supabase
          .from("loyalty_points")
          .select("points")
          .eq("user_id", userId)
          .single();

        const currentPoints = loyalty?.points || 0;

        await supabase
          .from("loyalty_points")
          .upsert({
            user_id: userId,
            points: currentPoints + pointsToAdd,
            updated_at: new Date()
          }, { onConflict: 'user_id' });
      }
    }
  }

  return NextResponse.json({ received: true });
}
