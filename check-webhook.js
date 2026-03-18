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

async function diagnostic() {
    console.log("=== DIAGNOSTIC CASSONNAISE ===");
    
    // 1. Check recent orders
    const { data: orders, error: oErr } = await supabase
        .from('orders')
        .select('id, status, created_at, total_cents')
        .order('created_at', { ascending: false })
        .limit(10);
    
    if (oErr) {
        console.error("Erreur Supabase:", oErr.message);
        return;
    }

    console.log("\n10 Dernières commandes :");
    orders.forEach(o => {
        const date = new Date(o.created_at).toLocaleString();
        const price = (o.total_cents / 100).toFixed(2) + "€";
        console.log(`[${o.status.toUpperCase()}] ID: ${o.id.slice(0,8)}... | ${date} | ${price}`);
    });

    console.log("\nNOTE: Si une commande est [PENDING] mais payée sur Stripe, le webhook a échoué.");
    console.log("Les logs de votre serveur (Vercel/etc) vous diront POURQUOI (Erreur de signature ? Erreur DB ?)");
    console.log("Maintenant que le dashboard est mis à jour, ces commandes apparaîtront avec un bouton 'Confirmer Paiement'.");
}

diagnostic().catch(console.error);
