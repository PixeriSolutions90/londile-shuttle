/**
 * Cloudflare Turnstile Bot Protection Utility
 *
 * Verifies Turnstile tokens server-side to prevent bot abuse
 */

/**
 * Verify Turnstile token server-side
 * @param token - Token from Turnstile widget
 * @param remoteIp - Client IP address (optional)
 */
export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string
): Promise<{
  success: boolean;
  error?: string;
  errorCodes?: string[];
}> {
  if (!token) {
    return {
      success: false,
      error: "Turnstile token is required",
    };
  }

  if (!process.env.TURNSTILE_SECRET_KEY) {
    console.error("TURNSTILE_SECRET_KEY not configured");
    // In development, allow if key is missing
    if (process.env.NODE_ENV === "development") {
      console.warn("⚠️  Turnstile secret key not set - allowing request in dev");
      return { success: true };
    }
    return {
      success: false,
      error: "Bot protection not configured",
    };
  }

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: remoteIp,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: "Failed to verify token",
        errorCodes: data.error_codes,
      };
    }

    if (!data.success) {
      return {
        success: false,
        error: "Turnstile verification failed",
        errorCodes: data["error-codes"],
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return {
      success: false,
      error: "Token verification error",
    };
  }
}
