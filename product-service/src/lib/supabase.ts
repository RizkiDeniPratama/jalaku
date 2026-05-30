import { createClient } from "@supabase/supabase-js";
// import type { Database } from "./database.types";
import type { Database } from "@repo/shared-types";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY Tidak Ada di .env",
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
