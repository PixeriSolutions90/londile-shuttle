import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const InviteAgentSchema = z.object({
  email: z.string().email("Must be a valid email address"),
  companyId: z.string().uuid("A company must be selected"),
});

/**
 * Admin: Invite Agent API
 * POST: Sends a real Supabase invite email and pre-sets the invited
 * profile's role to 'agent'. The invited person clicks the emailed link,
 * lands on /auth/accept-invite, and sets their own password — the admin
 * never sees or sets a password on their behalf.
 *
 * Not using the assign_role_to_user() RPC here: that function checks the
 * CALLING request's own role via auth.uid()/JWT claims, which resolves to
 * Postgres's "service_role" (not our app's 'admin') for service-role-key
 * calls — it would reject itself. Since authorization is already verified
 * explicitly below (defense-in-depth, same pattern as the other /api/admin
 * routes), a direct table write via the service-role client is correct here.
 */
export async function POST(request: NextRequest) {
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

  // Role derived from the verified session + DB — see the comment in
  // /api/admin/agents/route.ts for why a client-supplied header isn't safe here.
  const { data: callerProfile } = await supabaseClient
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (callerProfile?.role !== "admin") {
    console.warn(`Unauthorized agent-invite attempt by user: ${session.user.id}`);
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
    const body = await request.json();
    const result = InviteAgentSchema.safeParse(body);

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        errors[err.path.join(".")] = err.message;
      });
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
    }

    const { email, companyId } = result.data;

    // Confirm the company actually exists before sending an email nobody
    // can act on if it doesn't.
    const { data: company, error: companyError } = await supabaseAdmin
      .from("companies")
      .select("id, name")
      .eq("id", companyId)
      .eq("is_active", true)
      .single();

    if (companyError || !company) {
      return NextResponse.json({ error: "Selected company not found" }, { status: 400 });
    }

    const redirectTo = new URL("/auth/accept-invite", request.nextUrl.origin).toString();

    const { data: invited, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      { redirectTo }
    );

    if (inviteError) {
      console.error("Invite send error:", inviteError);
      return NextResponse.json(
        { error: inviteError.message || "Failed to send invite" },
        { status: 400 }
      );
    }

    const newUserId = invited.user.id;

    // handle_new_user() trigger already created a profiles row with role='user' — promote it.
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        role: "agent",
        company_id: companyId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", newUserId);

    if (updateError) {
      console.error("Failed to set invited profile role:", updateError);
      return NextResponse.json(
        { error: "Invite sent, but failed to set agent role. Assign it manually." },
        { status: 500 }
      );
    }

    // Keep JWT custom claims in sync, same as assign_role_to_user() does.
    await supabaseAdmin.auth.admin.updateUserById(newUserId, {
      app_metadata: { role: "agent" },
    });

    await supabaseAdmin.from("audit_logs").insert({
      user_id: session.user.id,
      action: "agent_invited",
      resource: `user:${newUserId}`,
      details: { email, company_id: companyId, company_name: company.name },
    });

    return NextResponse.json(
      { success: true, message: `Invite sent to ${email} for ${company.name}`, userId: newUserId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Invite agent API error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
