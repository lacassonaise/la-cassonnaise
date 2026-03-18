const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const env = {};
envFile.split(/\r?\n/).forEach(line => {
    if (line.trim().startsWith('#') || line.trim() === '') return;
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) { env[match[1].trim()] = match[2].trim(); }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrders() {
    console.log("Checking for pending orders...");
    const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'pending')
        .limit(5);

    if (error) {
        console.error("Error fetching orders:", error);
        return;
    }

    console.log(`Found ${orders.length} pending orders.`);
    orders.forEach(o => {
        console.log(`Order ID: ${o.id}, Created At: ${o.created_at}`);
    });

    if (orders.length > 0) {
        const testOrder = orders[0];
        console.log(`Attempting to update order ${testOrder.id} to 'paid'...`);
        const { error: updateError } = await supabase
            .from('orders')
            .update({ status: 'paid', paid_at: new Date().toISOString() })
            .eq('id', testOrder.id);

        if (updateError) {
            console.error("Failed to update order:", updateError);
        } else {
            console.log("✅ Successfully updated order status to 'paid'.");
            
            // Verify it was updated
            const { data: updatedOrder } = await supabase
                .from('orders')
                .select('status')
                .eq('id', testOrder.id)
                .single();
            console.log(`New status for ${testOrder.id}: ${updatedOrder?.status}`);
        }
    }
}

checkOrders().catch(console.error);
