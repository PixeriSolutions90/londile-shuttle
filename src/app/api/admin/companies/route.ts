import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CreateCompanySchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters").max(200),
  vatNumber: z.string().max(50).optional(),
  registrationNumber: z.string().max(50).optional(),
  address: z.string().max(300).optional(),
});

function getAnonClient(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
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
}

function getAdminClient(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
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
}

async function requireAdmin(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  const supabaseClient = getAnonClient(cookieStore);
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  if (!session) return { ok: false as const, status: 401 };

  const { data: callerProfile } = await supabaseClient
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (callerProfile?.role !== "admin") return { ok: false as const, status: 403 };

  return { ok: true as const, session };
}

/**
 * Admin Companies API
 * GET: List active companies (for the invite-agent picker and future
 * company-management UI).
 * POST: Create a new company.
 */
export async function GET() {
  const cookieStore = await cookies();
  const auth = await requireAdmin(cookieStore);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const supabaseAdmin = getAdminClient(cookieStore);

  try {
    const { data, error } = await supabaseAdmin
      .from("companies")
      .select("id, name, vat_number, registration_number, address, is_active, created_at")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      console.error("Failed to fetch companies:", error);
      return NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Companies API error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const auth = await requireAdmin(cookieStore);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const supabaseAdmin = getAdminClient(cookieStore);

  try {
    const body = await request.json();
    const result = CreateCompanySchema.safeParse(body);

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        errors[err.path.join(".")] = err.message;
      });
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
    }

    const { name, vatNumber, registrationNumber, address } = result.data;

    const { data, error } = await supabaseAdmin
      .from("companies")
      .insert({
        name,
        vat_number: vatNumber || null,
        registration_number: registrationNumber || null,
        address: address || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create company:", error);
      const isDuplicate = error.code === "23505";
      return NextResponse.json(
        { error: isDuplicate ? "A company with this name already exists" : "Failed to create company" },
        { status: 400 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Companies API error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
