import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Creating a paid order...");
  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      status: "paid",
      total_cents: 2500, // 25.00 EUR
      phone: "0600000000",
      note: "TEST PAID ORDER created by AI",
      mode: "pickup",
      paid_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating order:", error);
    return;
  }

  console.log("Order created successfully! ID:", order.id);

  // Insert a dummy item
  console.log("Adding an item to setup the order fully...");
  const { error: itemError } = await supabase
    .from("order_items")
    .insert({
      order_id: order.id,
      name_snapshot: "Test Burger",
      price_cents: 2500,
      quantity: 1,
      customizations_json: {},
    });

  if (itemError) {
    console.error("Error adding item:", itemError);
  } else {
    console.log("Item added successfully.");
  }
}

main().catch(console.error);
