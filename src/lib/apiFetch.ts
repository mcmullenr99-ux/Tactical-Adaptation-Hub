// Base44 backend function base URL
export const FUNCTIONS_BASE = "https://agent-tag-lead-developer-cff87ae4.base44.app/functions";

// Route map: /api/<prefix> → function name
// NOTE: longest prefix wins — more specific routes must be listed before generic ones
const ROUTE_MAP: Record<string, string> = {
  "/api/auth/verify-email":      "authVerifyEmail",
  "/api/auth/resend-verification": "authResendVerification",
  "/api/auth/login":            "authLogin",
  "/api/auth/register":        "authRegister",
  "/api/auth/me":               "authMe",
  "/api/auth/logout":           "authLogout",
  "/api/auth/profile":          "authUpdateProfile",
  "/api/auth/password":         "authUpdateProfile",
  "/api/auth/upload-avatar":    "authUpdateProfile",
  "/api/auth/forgot-password":  "authForgotPassword",
  "/api/auth/reset-password":   "authResetPassword",
  "/api/auth/account":          "authMe",
  "/api/auth/2fa":              "twoFactor",
  "/api/duty-status":           "users",
  "/api/users":                 "users",
  "/api/messages":              "messages",
  "/api/events":                "events",
  "/api/ops":                   "events",
  "/api/posts":                 "posts",
  "/api/friends":               "friends",
  "/api/notifications":         "notifications",
  "/api/milsim-groups/leaderboard-stats": "leaderboardStats",
  "/api/milsim-groups":         "milsimGroups",
  "/api/leaderboard-stats":     "leaderboardStats",
  "/api/milsim-aars":           "milsimAars",
  "/api/motd":                  "motd",
  "/api/admin":                 "admin",
  "/api/security":              "security",
  "/api/staff-applications":    "staffApplications",
  "/api/stats":                 "stats",
  "/api/support":               "support",
  "/api/stripe":                "stripe",
  "/api/referral-code":         "users",
  "/api/users/profile":         "users",
  "/api/reputation":            "reputation",
  "/api/group-upvotes":         "groupUpvotes",
  "/api/milsim-awards":         "milsimAwards",
  "/api/training-docs":         "trainingDocs",
};

// Sub-path routes: when a URL matches /api/milsim-groups/:id/<keyword>, route to a different function
// Key = sub-path keyword, Value = function name
const MILSIM_GROUP_SUBPATH_MAP: Record<string, string> = {
  "qualifications": "qualifications",
  "warnos":         "milsimGroups",
  "briefings":      "milsimBriefings",
};

/** Resolve /api/... path to a full Base44 function URL, using ?path= for sub-paths */
function resolveUrl(path: string): string {
  if (path.startsWith("http")) return path;

  // Special case: /api/milsim-groups/:id/<keyword>/... → route to dedicated function
  const mgSubMatch = path.match(/^\/api\/milsim-groups\/([^/]+)\/([^/?]+)(.*)?$/);
  if (mgSubMatch) {
    const groupId = mgSubMatch[1];
    const keyword = mgSubMatch[2];
    const rest = mgSubMatch[3] ?? "";
    const fn = MILSIM_GROUP_SUBPATH_MAP[keyword];
    if (fn) {
      const subPath = `/${groupId}/${keyword}${rest}`;
      return `${FUNCTIONS_BASE}/${fn}?path=${encodeURIComponent(subPath)}`;
    }
  }

  // Try longest prefix match
  let bestPrefix = "";
  let bestFn = "";
  for (const [prefix, fn] of Object.entries(ROUTE_MAP)) {
    if (path.startsWith(prefix) && prefix.length > bestPrefix.length) {
      bestPrefix = prefix;
      bestFn = fn;
    }
  }

  if (bestFn) {
    const subPath = path.slice(bestPrefix.length);
    if (subPath) {
      return `${FUNCTIONS_BASE}/${bestFn}?path=${encodeURIComponent(subPath)}`;
    }
    return `${FUNCTIONS_BASE}/${bestFn}`;
  }

  // Fallback
  return `${FUNCTIONS_BASE}${path.replace(/^\/api/, "")}`;
}

/** Get the stored auth token */
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

  // Don't set Content-Type for FormData — let the browser set multipart boundary
  const isFormData = options?.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options?.headers as Record<string, string> ?? {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? res.statusText);
  return data as T;
}
