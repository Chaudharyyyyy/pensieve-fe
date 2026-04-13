import { supabase } from "./supabase";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

type FetchOptions = RequestInit & {
  requireAuth?: boolean;
};

export async function apiFetch(endpoint: string, options: FetchOptions = {}) {
  const { requireAuth = true, headers: customHeaders, ...restOptions } = options;
  
  const headers = new Headers(customHeaders);
  headers.set("Content-Type", "application/json");

  if (requireAuth) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers.set("Authorization", `Bearer ${session.access_token}`);
    } else {
      console.warn(`No session found for auth-required endpoint: ${endpoint}`);
    }
  }

  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...restOptions,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Optional: Handle token expiration or unauthorized (e.g. redirect to login)
      window.dispatchEvent(new Event("auth-unauthorized"));
    }
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || `API Request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
