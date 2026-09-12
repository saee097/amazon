import { readFileSync, existsSync } from "fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv(file) {
  if (!existsSync(file)) return {};
  const env = {};
  for (const line of readFileSync(file, "utf-8").split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    let val = line.slice(i + 1);
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[line.slice(0, i)] = val;
  }
  return env;
}

const env = { ...loadEnv(".env.local"), ...loadEnv(".env.production.local") };

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const tests = [
  () => supabase.from("profiles").select("id").limit(1),
  () => supabase.from("products").select("*, categories(*), brands(*), product_variants(*), product_images(*)").eq("status", "active").limit(1),
];

for (const test of tests) {
  const { data, error } = await test();
  console.log(error ? `ERROR: ${error.message} (${error.code})` : `OK: ${JSON.stringify(data)?.slice(0, 200)}`);
}
