import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function normalizeUsername(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 32);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Método não permitido." });

  try {
    const body = await req.json().catch(() => ({}));
    const username = normalizeUsername(body?.username);
    const password = String(body?.password ?? "");

    if (username.length < 3) return json(400, { error: "Use um usuário com pelo menos 3 caracteres." });
    if (password.length < 8) return json(400, { error: "A senha deve ter pelo menos 8 caracteres." });
    if (password.length > 128) return json(400, { error: "A senha é longa demais." });

    const url = Deno.env.get("SUPABASE_URL");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceRole) return json(500, { error: "Configuração de autenticação indisponível." });

    const admin = createClient(url, serviceRole, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const email = `u_${username}@course.conectae.app`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username,
        display_name: username,
        auth_mode: "username",
      },
    });

    if (error) {
      const message = String(error.message || "").toLowerCase();
      if (message.includes("already") || message.includes("registered") || message.includes("exists")) {
        return json(409, { error: "Esse usuário já existe. Escolha outro ou entre com sua senha.", code: "username_taken" });
      }
      console.error("course username create failed", error);
      return json(400, { error: "Não foi possível criar esse usuário agora." });
    }

    return json(201, { ok: true, username, userId: data.user?.id ?? null });
  } catch (error) {
    console.error("course-username-register failed", error);
    return json(500, { error: "Não foi possível criar o acesso agora." });
  }
});
