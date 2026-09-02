"use client";

import { useEffect, useRef } from "react";

/**
 * OAuthCallbackHandler — after Binance redirects to /?code=...&state=..., this reads the code,
 * pulls the PKCE verifier from sessionStorage, POSTs them to /api/oauth/exchange, then clears the
 * query string so the page sits in a clean state.
 */
export function OAuthCallbackHandler() {
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state") ?? "";

    if (code) {
      done.current = true;
      (async () => {
        const verifier = sessionStorage.getItem("mcp_verifier") ?? "";
        try {
          const res = await fetch("/api/oauth/exchange", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, verifier, state }),
          });
          const j = await res.json();
          if (j.ok) {
            sessionStorage.removeItem("mcp_verifier");
            sessionStorage.removeItem("mcp_state");
          } else {
            console.error("oauth exchange error", j.error);
          }
        } catch (e) {
          console.error("oauth exchange threw", e);
        } finally {
          // Clean the URL (history.replaceState to avoid a reload).
          window.history.replaceState({}, "", "/");
        }
      })();
    }
  }, []);

  return null;
}
