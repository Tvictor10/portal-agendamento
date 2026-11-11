
import "server-only";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const portalSecretKey = process.env.SUPABASE_PORTAL_SECRET_KEY;

if (!supabaseUrl || !portalSecretKey) {
  throw new Error(
    "Configuracao administrativa do Supabase ausente."
  );
}

export const supabasePortalAdmin = createClient(
  supabaseUrl,
  portalSecretKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
