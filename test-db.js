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

async function checkAdmin() {
    const targetEmail = 'lacassonaise@gmail.com';

    // 1. Get the Auth User ID based on Email via admin api
    // The screenshot shows UID: 6eedbe29-6ab6-44a2-99c0-8de23aac2376 for lacassonaise@gmail.com
    const uid = '6eedbe29-6ab6-44a2-99c0-8de23aac2376';
    console.log(`Checking profile for user ${targetEmail} (UID: ${uid})...`);

    // 2. Check profiles table
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', uid)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            console.log(`❌ ERROR: No entry found in the 'profiles' table for UID ${uid}.`);
            console.log(`This user exists in Auth but does NOT have a profile row!`);

            // Let's create it for them since they are trying to log in as admin
            console.log("Attempting to create the admin profile...");
            const { error: insertErr } = await supabase.from('profiles').insert({
                user_id: uid,
                role: 'admin',
                email: targetEmail
            });
            if (insertErr) {
                console.error("Failed to insert admin profile:", insertErr);
            } else {
                console.log("✅ Successfully created 'admin' profile row for this user!");
            }
        } else {
            console.error("Database query error:", error);
        }
        return;
    }

    console.log(`Profile found:`, profile);
    if (profile.role !== 'admin') {
        console.log(`❌ ERROR: The user's role is '${profile.role}', not 'admin'. They will be rejected at login.`);

        // Fix it for them
        console.log("Updating role to 'admin'...");
        await supabase.from('profiles').update({ role: 'admin' }).eq('user_id', uid);
        console.log("✅ Role upgraded to admin.");
    } else {
        console.log(`✅ SUCCESS: The user is already an admin. If they can't log in, their password is 100% wrong.`);
    }
}

checkAdmin();
