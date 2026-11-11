import createClient from "openapi-fetch";
import type { paths, components } from "./schema";
export type Profile = components["schemas"]["Profile"];
export type ProfileUpdate = components["schemas"]["ProfileUpdate"];
let csrf = "";
export function setCsrf(value: string) {
  csrf = value;
}
export const api = createClient<paths>({
  credentials: "same-origin",
  cache: "no-store",
});
api.use({
  onResponse({ request, response }) {
    if (
      response.status === 401 &&
      typeof window !== "undefined" &&
      (new URL(request.url).pathname.startsWith("/api/v1/practice") ||
        new URL(request.url).pathname.startsWith("/api/v1/integration") ||
        new URL(request.url).pathname.startsWith("/api/v1/content") ||
        [
          "/api/v1/me",
          "/api/v1/me/delete",
          "/api/v1/me/export",
          "/api/v1/auth/password",
          "/api/v1/auth/logout",
        ].includes(new URL(request.url).pathname))
    ) {
      window.dispatchEvent(new Event("chord-session-expired"));
    }
    return response;
  },
  onRequest({ request }) {
    if (csrf && !["GET", "HEAD"].includes(request.method))
      request.headers.set("X-CSRF-Token", csrf);
    return request;
  },
});
export function apiError(value: unknown): string {
  if (value && typeof value === "object" && "error" in value) {
    const error = value.error;
    if (error && typeof error === "object" && "message" in error) {
      if (
        "fields" in error &&
        Array.isArray(error.fields) &&
        error.fields.length
      ) {
        return (
          String(error.message) +
          ": " +
          error.fields
            .map((item: { field: string }) =>
              item.field.replace(/^body\./, "").replaceAll("_", " "),
            )
            .join(", ")
        );
      }
      return String(error.message);
    }
  }
  return "Unable to connect. Check your connection and try again.";
}
