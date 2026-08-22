import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Admin-only endpoint to assign roles to users
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();

  // First, verify the user is authenticated
  const supabaseClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return Array.from(cookieStore.getAll()).map((c) => ({
            name: c.name,
            value: c.value,
          }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
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
  // AUTHORIZATION: Explicit role check (defense-in-depth over RLS)
  // ============================================================================
  const userRole = request.headers.get("x-user-role");
  if (userRole !== "admin") {
    console.warn(`Unauthorized role assignment attempt by user role: ${userRole}`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Now use service role key to assign the role
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return Array.from(cookieStore.getAll()).map((c) => ({
            name: c.name,
            value: c.value,
          }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  try {
    const { userId, role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json(
        { error: "Missing userId or role" },
        { status: 400 }
      );
    }

    // Call Supabase function to assign role (RLS will check admin permission)
    const { data, error } = await supabase.rpc("assign_role_to_user", {
      target_user_id: userId,
      new_role: role,
    });

    if (error) {
      console.error("Role assignment error:", error);
      return NextResponse.json(
        { error: "Failed to assign role" },
        { status: 400 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}
