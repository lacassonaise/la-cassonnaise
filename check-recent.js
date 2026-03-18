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

async function checkRecentOrders() {
    console.log("Checking for the 5 most recent orders...");
    const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error fetching orders:", error);
        return;
    }

    orders.forEach(o => {
        console.log(`Order ID: ${o.id}, Status: ${o.status}, Created At: ${o.created_at}`);
    });
}

checkRecentOrders().catch(console.error);
