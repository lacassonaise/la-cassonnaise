import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia" as any,
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    console.warn("⚠️ Requête webhook sans signature Stripe reçue.");
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  if (!endpointSecret) {
    console.error("❌ STRIPE_WEBHOOK_SECRET est manquant dans les variables d'environnement.");
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    console.error(`❌ Erreur de validation de signature Stripe: ${err.message}`);
    console.error(`Secret utilisé: ${endpointSecret.slice(0, 10)}...`);
    console.error(`Signature reçue: ${sig.slice(0, 10)}...`);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  console.log("🔔 Webhook Stripe reçu avec succès");
  console.log("Type d'événement:", event.type);
  console.log("ID de l'événement:", event.id);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    const userId = session.metadata?.userId;

    console.log("📦 Session de paiement terminée");
    console.log("ID de commande (metadata):", orderId);
    console.log("ID d'utilisateur (metadata):", userId);

    if (orderId) {
      try {
        const supabase = getSupabaseAdmin();

        // 1. Mettre à jour le statut de la commande
        console.log(`📝 Mise à jour de la commande ${orderId} en 'paid'...`);
        const { error: orderError } = await supabase
          .from("orders")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
          })
          .eq("id", orderId);

        if (orderError) {
          console.error("❌ Erreur lors de la mise à jour de la commande:", orderError.message);
        } else {
          console.log(`✅ Commande ${orderId} mise à jour avec succès.`);
        }

        // 2. Créditer les points de fidélité (1€ = 1pt)
        const amountTotal = session.amount_total || 0;
        const pointsToAdd = Math.floor(amountTotal / 100);

        if (userId && pointsToAdd > 0) {
          console.log(`💎 Attribution de ${pointsToAdd} points à l'utilisateur ${userId}...`);
          
          // Récupérer les points actuels
          const { data: loyalty, error: fetchLoyaltyError } = await supabase
            .from("loyalty_points")
            .select("points")
            .eq("user_id", userId)
            .single();

          if (fetchLoyaltyError && fetchLoyaltyError.code !== 'PGRST116') {
            console.error("❌ Erreur lors de la récupération des points:", fetchLoyaltyError.message);
          }

          const currentPoints = loyalty?.points || 0;
          console.log(`Points actuels: ${currentPoints}, nouveaux points: ${currentPoints + pointsToAdd}`);

          const { error: upsertError } = await supabase
            .from("loyalty_points")
            .upsert({
              user_id: userId,
              points: currentPoints + pointsToAdd,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

          if (upsertError) {
            console.error("❌ Erreur lors de l'attribution des points:", upsertError.message);
          } else {
            console.log("✅ Points de fidélité crédités.");
          }
        } else {
          console.log("ℹ️ Pas de userId ou de points à ajouter (métadonnées manquantes ou montant insuffisant).");
        }
      } catch (dbError: any) {
        console.error("🔥 Erreur critique lors des opérations de base de données:", dbError.message);
      }
    } else {
      console.warn("⚠️ Attention: orderId manquant dans les métadonnées de la session Stripe.");
    }
  } else {
    console.log(`ℹ️ Événement type ${event.type} ignoré (seul checkout.session.completed est traité ici).`);
  }

  return NextResponse.json({ received: true });
}
