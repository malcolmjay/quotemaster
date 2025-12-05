/**
 * Shared Authentication Middleware for Edge Functions
 * Centralizes authentication logic to avoid code duplication
 */

export interface AuthResult {
  isAuthenticated: boolean;
  userId: string | null;
  error?: { status: number; message: string };
}

export interface AuthConfig {
  configKeyPrefix: string; // e.g., 'import_api', 'customer_import_api'
  requireAuth?: boolean; // If false, allows requests without auth when disabled
}

/**
 * Authenticate incoming request
 */
export async function authenticateRequest(
  req: Request,
  supabase: any,
  config: AuthConfig
): Promise<AuthResult> {
  // Check if authentication is enabled for this endpoint
  const { data: authEnabledConfig } = await supabase
    .from("app_configurations")
    .select("config_value")
    .eq("config_key", `${config.configKeyPrefix}_enabled`)
    .maybeSingle();

  const isAuthEnabled = authEnabledConfig?.config_value === "true";

  if (!isAuthEnabled && config.requireAuth !== true) {
    // Auth not required - try to get user from token if provided
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      return { isAuthenticated: true, userId: user?.id || null };
    }

    return { isAuthenticated: true, userId: null };
  }

  // Auth is enabled - verify credentials
  const authHeader = req.headers.get("Authorization");

  if (!authHeader) {
    return {
      isAuthenticated: false,
      userId: null,
      error: {
        status: 401,
        message: "Authentication required. Please provide credentials.",
      },
    };
  }

  // Handle Basic Authentication
  if (authHeader.startsWith("Basic ")) {
    const result = await verifyBasicAuth(authHeader, supabase, config.configKeyPrefix);
    return result;
  }

  // Handle Bearer Token Authentication
  if (authHeader.startsWith("Bearer ")) {
    const result = await verifyBearerAuth(authHeader, supabase);
    return result;
  }

  return {
    isAuthenticated: false,
    userId: null,
    error: {
      status: 401,
      message: "Invalid authentication format. Use Basic or Bearer token.",
    },
  };
}

/**
 * Verify Basic Authentication credentials
 */
async function verifyBasicAuth(
  authHeader: string,
  supabase: any,
  configKeyPrefix: string
): Promise<AuthResult> {
  try {
    const base64Credentials = authHeader.replace("Basic ", "");
    const credentials = atob(base64Credentials);
    const [username, password] = credentials.split(":");

    // Get stored credentials from config
    const { data: storedUsername } = await supabase
      .from("app_configurations")
      .select("config_value")
      .eq("config_key", `${configKeyPrefix}_username`)
      .maybeSingle();

    const { data: storedPassword } = await supabase
      .from("app_configurations")
      .select("config_value")
      .eq("config_key", `${configKeyPrefix}_password`)
      .maybeSingle();

    const validUsername = storedUsername?.config_value || "";
    const validPassword = storedPassword?.config_value || "";

    // Constant-time comparison to prevent timing attacks
    const usernameMatch = constantTimeEqual(username, validUsername);
    const passwordMatch = constantTimeEqual(password, validPassword);

    if (usernameMatch && passwordMatch && validUsername && validPassword) {
      return { isAuthenticated: true, userId: null };
    }

    return {
      isAuthenticated: false,
      userId: null,
      error: {
        status: 401,
        message: "Invalid credentials",
      },
    };
  } catch (error) {
    return {
      isAuthenticated: false,
      userId: null,
      error: {
        status: 401,
        message: "Invalid authentication format",
      },
    };
  }
}

/**
 * Verify Bearer Token Authentication
 */
async function verifyBearerAuth(
  authHeader: string,
  supabase: any
): Promise<AuthResult> {
  try {
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return {
        isAuthenticated: false,
        userId: null,
        error: {
          status: 401,
          message: "Invalid token",
        },
      };
    }

    return { isAuthenticated: true, userId: user.id };
  } catch (error) {
    return {
      isAuthenticated: false,
      userId: null,
      error: {
        status: 401,
        message: "Invalid token",
      },
    };
  }
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Create unauthorized response with proper headers
 */
export function createUnauthorizedResponse(
  message: string,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      success: false,
      message,
    }),
    {
      status: 401,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        'WWW-Authenticate': 'Basic realm="Import API"',
      },
    }
  );
}
