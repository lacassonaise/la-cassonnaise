import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUUID = (val: string) => UUID_REGEX.test(val);

export async function POST(req: Request) {
  try {
    console.log("➡️ API /order appelée");

    const body = await req.json();
    console.log("📦 body reçu :", body);

    const {
      items,
      totalCents,
      deliveryFeeCents,
      deliveryType,
      phone,
      note,
      address,
      city,
      postalCode,
      userId,
    } = body;

    console.log("🧾 items :", items);

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Panier vide" }, { status: 400 });
    }

    console.log("🔐 init supabase");
    const supabase = getSupabaseAdmin();

    console.log("📝 création commande");
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id: userId ?? null,
        status: "pending",
        total_cents: totalCents,
        phone,
        note,
        mode: deliveryType,
        delivery_address:
          deliveryType === "delivery"
            ? `${address}, ${postalCode} ${city}`
            : null,
        delivery_fee_cents: deliveryType === "delivery" ? deliveryFeeCents : 0,
        distance_km: deliveryType === "delivery" ? body.distanceKm : null,
        reward_used: body.rewardUsed || null,
      })
      .select()
      .single();

    console.log("🧾 résultat insert order:", order, error);

    if (error) throw error;

    console.log("📦 insertion order_items");
    const orderItems = items.map((i: any) => ({
      order_id: order.id,
      product_id: i.productId && isUUID(i.productId) ? i.productId : null,
      name_snapshot: i.nameSnapshot ?? "Produit",
      price_cents: i.priceCents,
      quantity: i.quantity,
      customizations_json: i.customizations ?? {},
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) throw itemsError;

    console.log("💳 init stripe");
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2024-11-20.acacia" as any,
    });

    console.log("🧮 création session stripe");
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: totalCents,
            product_data: { name: "Commande" },
          },
        },
      ],
      metadata: {
        orderId: order.id,
        userId: userId ?? ""
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success?orderId=${order.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout`,
    });

    console.log("✅ Session Stripe créée avec succès:", session.id);
    console.log("🔗 URL de redirection:", session.url);

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    console.error("🔥 ERREUR API /order DETAILED :");
    console.error("Message:", e.message);
    console.error("Stack:", e.stack);

    if (e.type === "StripeAuthenticationError") {
      return NextResponse.json(
        { error: "Erreur d'authentification Stripe. Vérifiez votre clé API." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: "Erreur serveur critique",
        detail: e.message,
        hint: e.hint || "Veuillez vérifier vos clés Supabase dans .env.local"
      },
      { status: 500 }
    );
  }
}
