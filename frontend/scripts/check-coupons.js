const { createClient } = require('@supabase/supabase-js');
const { readFileSync, existsSync } = require('fs');
const { resolve } = require('path');

const envPath = resolve(process.cwd(), '.env.local');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq < 0) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key, {
  realtime: { transport: require('ws') },
});

async function main() {
  const { data, error } = await supabase.from('coupons').select('*');
  console.log('Coupons in DB:', data?.length || 0);
  if (error) console.log('Error:', error.message);
  if (data && data.length > 0) {
    console.log('First:', JSON.stringify({ code: data[0].code, active: data[0].active, valid_from: data[0].valid_from, valid_until: data[0].valid_until }, null, 2));
  }
  process.exit(0);
}
main().catch(e => { console.error('Caught:', e); process.exit(1); });
