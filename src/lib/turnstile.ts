/**
 * Cloudflare Turnstile Bot Protection Utility
 *
 * Canonical server-side siteverify per Cloudflare Spin specification.
 * Validates: success flag, action, and hostname.
 */

interface TurnstileVerificationResult {
  success: boolean;
  error?: string;
  errorCodes?: string[];
  action?: string;
  hostname?: string;
}

/**
 * Verify Turnstile token server-side (Canonical Spin Implementation)
 * @param token - Token from Turnstile widget (cf-turnstile-response)
 * @param remoteIp - Client IP address
 * @param expectedAction - Expected action from widget (default: "booking")
 */
export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string,
  expectedAction: string = "booking"
): Promise<TurnstileVerificationResult> {
  // Canonical validation: token length and format
  if (
    typeof token !== "string" ||
    token.length === 0 ||
    token.length > 2048
  ) {
    return {
      success: false,
      error: "Invalid token format",
    };
  }

  const secret = process.env.TURNSTILE_SECRET_KEY;
  const expectedHostnames = new Set(
    (process.env.TURNSTILE_HOSTNAMES ?? "")
      .split(",")
      .map((hostname) => hostname.trim())
      .filter(Boolean)
  );

  // Validate configuration
  if (!secret) {
    console.error("TURNSTILE_SECRET_KEY not configured");
    if (process.env.NODE_ENV === "development") {
      console.warn("⚠️  Turnstile secret key not set - allowing in dev");
      return { success: true };
    }
    return {
      success: false,
      error: "Bot protection not configured",
    };
  }

  if (expectedHostnames.size === 0) {
    console.error("TURNSTILE_HOSTNAMES not configured");
    return {
      success: false,
      error: "Turnstile hostnames not configured",
    };
  }

  try {
    // Canonical siteverify call per Cloudflare spec
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        signal: AbortSignal.timeout(10_000),
        body: new URLSearchParams({
          secret,
          response: token,
          remoteip: remoteIp || "",
        }),
      }
    );

    if (!response.ok) {
      console.error(`Turnstile siteverify error: ${response.status}`);
      return {
        success: false,
        error: "Siteverify request failed",
      };
    }

    const result = await response.json();

    // Canonical validation checks
    if (
      !result.success ||
      result.action !== expectedAction ||
      !expectedHostnames.has(result.hostname)
    ) {
      return {
        success: false,
        error: "Token validation failed",
        errorCodes: result["error-codes"],
        action: result.action,
        hostname: result.hostname,
      };
    }

    return {
      success: true,
      action: result.action,
      hostname: result.hostname,
    };
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return {
      success: false,
      error: "Token verification error",
    };
  }
}
