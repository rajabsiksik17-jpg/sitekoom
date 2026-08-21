// ============================================================================
// Create the initial Super Admin user (development/demo only).
//
// Usage:
//   node scripts/create-admin.mjs admin@sitekoom.com "StrongPass123" "Site Admin"
//
// Env vars required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// ============================================================================

import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

// Resolve the project root relative to this script (works from any cwd).
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");

// Next.js precedence: .env.local overrides .env. dotenv does not override
// already-set values, so loading .env.local first gives it priority.
config({ path: path.join(projectRoot, ".env.local") });
config({ path: path.join(projectRoot, ".env") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing env: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const email = process.argv[2] ?? "admin@sitekoom.com";
const password = process.argv[3] ?? "Sitekoom@2024";
const name = process.argv[4] ?? "Super Admin";

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
  // Find the super_admin role
  const { data: role } = await admin.from("roles").select("id").eq("key", "super_admin").single();
  if (!role) {
    console.error("super_admin role not found. Run the seed.sql first.");
    process.exit(1);
  }

  // Create the auth user
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (error) {
    console.error("Failed to create user:", error.message);
    process.exit(1);
  }

  // Assign super_admin role
  const { error: updateErr } = await admin
    .from("users")
    .update({ name, role_id: role.id })
    .eq("id", data.user.id);

  if (updateErr) {
    console.error("Failed to assign role:", updateErr.message);
    process.exit(1);
  }

  console.log(`\nSuper Admin created successfully!\n  Email: ${email}\n  User ID: ${data.user.id}`);
  console.log("Login at /admin with the password you provided.\n");
}

main();
