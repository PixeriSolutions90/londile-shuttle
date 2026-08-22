import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type UserRole = "admin" | "agent" | "user";

/**
 * Get current user's role
 * Returns null if not authenticated
 */
export async function getUserRole(): Promise<UserRole | null> {
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
