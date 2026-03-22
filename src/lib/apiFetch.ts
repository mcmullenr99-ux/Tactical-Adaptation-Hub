export const FUNCTIONS_BASE = "https://agent-tag-lead-developer-cff87ae4.base44.app/api/functions";

// Route map: /api/<prefix> → function name
const ROUTE_MAP: Record<string, string> = {
  "/api/auth/login":            "authLogin",
  "/api/auth/register":         "authRegister",
  "/api/auth/me":               "authMe",
  "/api/auth/logout":           "authLogout",
  "/api/auth/profile":          "authUpdateProfile",
  "/api/auth/forgot-password":  "authForgotPassword",
  "/api/auth/reset-password":   "authResetPassword",
  "/api/events":                "events",
  "/api/posts":                 "posts",
  "/api/messages":              "messages",
  "/api/friends":               "friends",
  "/api/users":                 "users",
  "/api/milsim-groups":         "milsimGroups",
  "/api/milsim-ops":            "milsimOps",
  "/api/milsim-aars":           "milsimAars",
  "/api/milsim-briefings":      "milsimBriefings",
  "/api/milsim-applications":   "milsimApplications",
  "/api/milsim-awards":         "milsimAwards",
  "/api/qualifications":        "qualifications",
  "/api/staff-applications":    "staffApplications",
  "/api/motd":                  "motd",
  "/api/notifications":         "notifications",
  "/api/admin":                 "admin",
  "/api/security":              "security",
  "/api/stats":                 "stats",
  "/api/duty-roster":           "dutyRoster",
  "/api/referral-code":         "users",
};

/** Resolve /api/... path to a full Base44 function URL */
function resolveUrl(path: string): string {
  if (path.startsWith("http")) return path;

  let bestPrefix = "";
  let bestFn = "";
  for (const [prefix, fn] of Object.entries(ROUTE_MAP)) {
    if (path.startsWith(prefix) && prefix.length > bestPrefix.length) {
      bestPrefix = prefix;
      bestFn = fn;
    }
  }

  if (bestFn) {
    // Strip the /api/<resource> prefix and pass the rest as the sub-path
    const subPath = path.slice(bestPrefix.length); // e.g. "" or "/inbox" or "/123/read"
    return `${FUNCTIONS_BASE}/${bestFn}${subPath}`;
  }

  // Fallback: convert /api/foo/bar → /functions/foo/bar
  return `${FUNCTIONS_BASE}${path.replace(/^\/api/, "")}`;
}

/** Get the stored auth token (set by AuthContext after login) */
function getAuthToken(): string | null {
  try {
    return sessionStorage.getItem("tag_auth_token") ?? localStorage.getItem("tag_auth_token");
  } catch {
    return null;
  }
}

export async function apiFetch<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const url = resolveUrl(path);
  const token = getAuthToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string> ?? {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
    // No credentials:include needed — we use Bearer tokens
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = (data as any)?.message ?? (data as any)?.error ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data as T;
}
