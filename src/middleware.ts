import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return Array.from(request.cookies.getAll()).map((c) => ({
            name: c.name,
            value: c.value,
          }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Get current user session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = request.nextUrl.pathname;

  // Protected routes requiring authentication
  const protectedRoutes = ["/dashboard", "/profile", "/bookings"];
  const agentRoutes = pathname.startsWith("/agent");
  const adminRoutes = pathname.startsWith("/admin");

  // If accessing protected routes without session, redirect to login
  if (
    (protectedRoutes.some((route) => pathname.startsWith(route)) ||
      agentRoutes ||
      adminRoutes) &&
    !session
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If user is authenticated, get their role
  if (session) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    // Gate agent routes
    if (agentRoutes && profile?.role !== "agent") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    // Gate admin routes
    if (adminRoutes && profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    // Attach user role to headers for use in API routes
    response.headers.set("x-user-role", profile?.role || "user");
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
