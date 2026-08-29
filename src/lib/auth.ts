import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Lazy singleton — constructed on first actual use, never at module load.
 * Next.js attempts to statically prerender pages during `next build`
 * (including 'use client' pages without a `dynamic = 'force-dynamic'`
 * export), which runs this module's top-level code in a build-time Node
 * context. A module-scope `createBrowserClient(...)` call executes there
 * too, which broke the Vercel build. Mirrors the lazy pattern already used
 * in `rate-limit.ts`'s `getRedis()`.
 */
let client: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client;
}

export type UserRole = "admin" | "agent" | "user";

/**
 * Sign in with email + password.
 * Throws with a user-facing message on failure.
 */
export async function signInWithEmail(email: string, password: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Sign up with email + password. First/surname are passed as signup
 * metadata (auth.users.raw_user_meta_data), and the on_auth_user_created
 * trigger reads them straight into the new profiles row — see migration
 * 008. This does NOT rely on a follow-up client-side .update() call: if
 * the project requires email confirmation (Supabase's default), there's
 * no active session yet immediately after signUp(), so a separate update
 * would be silently blocked by the "users can update own profile" RLS
 * policy (auth.uid() is null until the user confirms and logs in).
 *
 * Returns { requiresEmailConfirmation } so the UI can show the right message
 * — whether confirmation is required depends on the Supabase project's Auth
 * settings (Confirm email toggle), not on this code.
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  firstName: string,
  surname: string
) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { first_name: firstName, surname },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return { requiresEmailConfirmation: !data.session };
}

/**
 * Sign out the current user.
 */
export async function signOutUser() {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Get current user's role
 * Returns null if not authenticated
 */
export async function getUserRole(): Promise<UserRole | null> {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  return (profile?.role as UserRole) || "user";
}

/**
 * Check if current user is admin
 */
export async function isAdmin(): Promise<boolean> {
  return (await getUserRole()) === "admin";
}

/**
 * Check if current user is agent
 */
export async function isAgent(): Promise<boolean> {
  return (await getUserRole()) === "agent";
}

/**
 * Request agent role (user applies to become agent)
 */
export async function requestAgentRole(
  companyName: string,
  vatNumber: string,
  companyRegistration: string,
  companyAddress: string
) {
  const response = await fetch("/api/roles/request-agent", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      companyName,
      vatNumber,
      companyRegistration,
      companyAddress,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to request agent role");
  }

  return response.json();
}

/**
 * Get pending agent role requests (admin only)
 */
export async function getPendingAgentRequests() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("role_requests")
    .select("*")
    .eq("status", "pending")
    .eq("requested_role", "agent")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Review agent role request (admin only)
 */
export async function reviewAgentRequest(
  requestId: string,
  approved: boolean,
  adminNotes?: string
) {
  const response = await fetch("/api/roles/review-request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requestId,
      approved,
      adminNotes,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to review request");
  }

  return response.json();
}

/**
 * Assign role directly to user (admin only)
 */
export async function assignRole(userId: string, role: UserRole) {
  const response = await fetch("/api/roles/assign", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      role,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to assign role");
  }

  return response.json();
}
