import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(".env.production.local", "utf-8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      let val = l.slice(i + 1);
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      return [l.slice(0, i), val];
    })
);

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
