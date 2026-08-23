import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: "Server not configured" }, 500);
  }

  // The account to delete is taken from the verified JWT, never from the request body,
  // so a caller can only ever delete themselves.
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return json({ error: "Unauthorized" }, 401);
  }

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await callerClient.auth.getUser();
  if (userError || !userData.user) {
    return json({ error: "Unauthorized" }, 401);
  }

  const userId = userData.user.id;
  const admin = createClient(supabaseUrl, serviceRoleKey);

  // Remove the rows that are not covered by an ON DELETE CASCADE first.
  await admin.from("saved_universities").delete().eq("user_id", userId);
  await admin.from("questionnaire_progress").delete().eq("user_id", userId);
  await admin.from("sharing_consents").delete().eq("user_id", userId);
  await admin.from("user_feedback").delete().eq("user_id", userId);
  await admin.from("match_history").delete().eq("user_id", userId);
  await admin.from("student_sessions").delete().eq("user_id", userId);
  await admin.from("user_profiles").delete().eq("id", userId);

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    console.error("delete-account failed", deleteError);
    return json({ error: "Could not delete account" }, 500);
  }

  return json({ success: true }, 200);
});
