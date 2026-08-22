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
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      // If profile doesn't exist yet, default to "user"
      if (error && error.code === "PGRST116") {
        response.headers.set("x-user-role", "user");
      } else if (error) {
        // If table doesn't exist or other error, allow access for now
        console.error("Profile lookup error:", error);
        response.headers.set("x-user-role", "user");
      } else {
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
    } catch (error) {
      console.error("Middleware error:", error);
      // Allow access on error (profiles table might not exist yet)
      response.headers.set("x-user-role", "user");
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match protected routes only:
     * - /dashboard
     * - /profile
     * - /bookings
     * - /agent (and subroutes)
     * - /admin (and subroutes)
     *
     * Excluded (public):
     * - /book, /lookup (public booking forms)
     * - /login, /signup (auth pages)
     * - /privacy, /terms, /data-retention (policy pages)
     * - api/* (API routes)
     * - _next/*, favicon.ico, public (Next.js internals)
     */
    "/dashboard/:path*",
    "/profile/:path*",
    "/bookings/:path*",
    "/agent/:path*",
    "/admin/:path*",
  ],
};
