import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/**
 * Admin Agents API
 * GET: List all profiles with role 'agent' or 'admin', merged with their
 * email (which lives on auth.users, not profiles, so this requires the
 * service-role Admin API rather than a plain table read).
 */
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();

  const supabaseClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return Array.from(cookieStore.getAll()).map((c) => ({ name: c.name, value: c.value }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ============================================================================
  // AUTHORIZATION: Role derived from the verified session + DB, not a
  // client-supplied header. This route isn't covered by middleware's matcher
  // (/api/* isn't matched there), so an `x-user-role` request header would
  // be entirely client-controlled and spoofable — never trust it here.
  // ============================================================================
  const { data: callerProfile } = await supabaseClient
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (callerProfile?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return Array.from(cookieStore.getAll()).map((c) => ({ name: c.name, value: c.value }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );

  try {
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id, role, first_name, surname, contact_number, created_at, companies(id, name)")
      .in("role", ["agent", "admin"])
      .order("created_at", { ascending: false });

    if (profilesError) {
      console.error("Failed to fetch agent profiles:", profilesError);
      return NextResponse.json({ error: "Failed to fetch agents" }, { status: 500 });
    }

    // Emails live on auth.users, not profiles — merge via the Admin API.
    const { data: userList, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000,
    });

    if (usersError) {
      console.error("Failed to list auth users:", usersError);
      return NextResponse.json({ error: "Failed to fetch agents" }, { status: 500 });
    }

    const emailById = new Map(userList.users.map((u) => [u.id, u.email]));

    const agents = (profiles ?? []).map((p) => {
      const company = Array.isArray(p.companies) ? p.companies[0] : p.companies;
      return {
        id: p.id,
        role: p.role,
        firstName: p.first_name,
        surname: p.surname,
        email: emailById.get(p.id) ?? null,
        contactNumber: p.contact_number,
        companyId: company?.id ?? null,
        companyName: company?.name ?? null,
        createdAt: p.created_at,
      };
    });

    return NextResponse.json(agents, { status: 200 });
  } catch (error) {
    console.error("Admin agents API error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
